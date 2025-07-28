import 'server-only';
import { env } from '@/common/config/env';
import logger from '@/lib/services/logger.server';

import { GetSignedUrlConfig, Storage } from '@google-cloud/storage';
import { Readable } from 'stream';

export class StorageService {
  private provider: Storage;

  private getCredentials() {
    return JSON.parse(
      Buffer.from(env.GCP_SERVICE_ACCOUNT, 'base64').toString('utf-8')
    ) as any;
  }

  constructor() {
    try {
      this.provider = new Storage({
        projectId: env.GCP_PROJECT_ID,
        credentials: this.getCredentials(),
      });
    } catch (error) {
      console.error('Error instantiating Storage:', error);
      throw error;
    }
  }

  getBucket(type: 'public' | 'private') {
    return this.provider.bucket(
      type === 'public' ? env.PUBLIC_BUCKET : env.PRIVATE_BUCKET
    );
  }
  //save file on the bucket
  async saveFile(
    type: 'public' | 'private',
    fileName: string,
    fileBuffer: Buffer
  ): Promise<boolean> {
    const bucket = this.getBucket(type);
    const file = bucket.file(fileName);

    return new Promise((resolve) => {
      const fileStream = file.createWriteStream({
        resumable: false,
      });

      fileStream
        .on('finish', () => {
          resolve(true);
        })
        .on('error', () => {
          resolve(false);
        });

      fileStream.end(fileBuffer);
    });
  }

  // Same as saveFile but for streams
  async saveFileFromStream(
    type: 'public' | 'private',
    fileName: string,
    stream: Readable
  ) {
    const bucket = this.getBucket(type);
    const file = bucket.file(fileName);

    return new Promise((resolve, reject) => {
      const writeStream = file.createWriteStream({
        resumable: false,
      });

      writeStream
        .on('finish', () => {
          writeStream.end();
          resolve({ success: true });
        })
        .on('error', (error) => {
          writeStream.end();
          reject({ success: false, error: error });
        });

      stream.pipe(writeStream);
    });
  }

  /**
   * Generate a presigned URL for uploading a file to GCP Storage
   * @param params - The parameters for the presigned URL
   * @returns The file name and the presigned URL
   */
  async getPresignedUrlForUpload(params: {
    bucket: 'public' | 'private';
    fileName: string;
    expiresInMinutes?: number;
  }): Promise<{ fileName: string; url: string }> {
    const { fileName } = params;
    const bucket = this.getBucket(params.bucket);
    const file = bucket.file(fileName);
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + (params.expiresInMinutes ?? 15) * 60 * 1000,
    });

    return { fileName, url };
  }

  /**
   * Generate a signed URL for reading a file from GCP Storage. Does not create a record in DocumentSignedUrl table.
   * @param bucketName - The name of the bucket
   * @param fileName - The name of the file
   * @param opt - Optional parameters for the signed URL
   * @returns A signed URL for reading the file
   */
  async generateReadSignedUrl(
    bucket: 'public' | 'private',
    fileName: string,
    opt?: Omit<GetSignedUrlConfig, 'action' | 'version'>
  ) {
    // These options will allow temporary read access to the file
    const options = opt || ({} as GetSignedUrlConfig);
    if (!options.expires) {
      // Add default expiration
      options.expires = Date.now() + 24 * 60 * 60 * 1000; // 1 day
    }

    // Get a v4 signed URL for reading the file
    const file = this.getBucket(bucket).file(fileName);

    const [exists] = await file.exists();
    if (!exists) {
      logger(`File not found: ${bucket}/${fileName}`, {
        bucket,
        fileName,
        opt,
      });
      return '';
    }

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      ...options,
    });

    return url;
  }

  /**
   * Returns the base URL for a bucket with the trailing slash
   */
  getBucketUrl(bucket: 'public' | 'private') {
    const base = `https://storage.googleapis.com/`;
    return bucket === 'public'
      ? `${base}${env.PUBLIC_BUCKET}/`
      : `${base}${env.PRIVATE_BUCKET}/`;
  }

  /**
   * Returns the URL for a file in a bucket
   * @param bucket - The bucket to get the URL for
   * @param fileName - The name of the file
   * @returns The URL for the file
   */
  getFileUrl(
    bucket: 'public' | 'private',
    fileName: string,
    opt: { encode?: boolean } = { encode: true }
  ) {
    // If the file name is a valid URL, return it
    if (this.isValidUrl(fileName)) {
      return fileName;
    }
    const cleanFileName = fileName.startsWith('/')
      ? fileName.slice(1)
      : fileName;
    return `${this.getBucketUrl(bucket)}${opt?.encode ? encodeURIComponent(cleanFileName) : cleanFileName}`;
  }
  private isValidUrl(url: string) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
