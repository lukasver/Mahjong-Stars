import { env } from '@/common/config/env';

/**
 * Uploads a file to a specified AWS S3-compatible bucket URL using a PUT request.
 *
 * @param file - The file to upload.
 * @param url - The pre-signed or direct S3-compatible bucket URL to upload the file to.
 * @returns A promise that resolves to the response object if successful, or throws an error if the upload fails.
 */
export async function uploadFile(
  file: File | { file: File; name: string },
  url: string
): Promise<{
  fileName: string;
  status: number;
  url: string;
}> {
  let response: Response;
  try {
    response = await fetch(url.trim(), {
      method: 'PUT',
      body: 'file' in file ? file.file : file,
    });
  } catch (err: unknown) {
    console.debug('ERROR', err);
    throw new Error(
      `Network error while uploading file: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `File upload failed with status ${response.status}: ${errorText}`
    );
  }

  return {
    fileName: 'file' in file ? file.name : file.name,
    status: response.status,
    url: response.url,
  };
}

export const getBucketUrl = (url: string) => {
  const base = env.NEXT_PUBLIC_BUCKET_PUBLIC_URL;

  if (url.startsWith(base)) {
    return url;
  }
  if (url?.startsWith('/')) {
    return `${base}${url}`;
  }
  if (!url?.startsWith('http') && !url?.startsWith('/')) {
    return `${base}/${url}`;
  }
  return url;
};
