import 'server-only';
import { Documenso } from '@documenso/sdk-typescript';
import { invariant } from '@epic-web/invariant';
import { env } from '@/common/config/env';
import { StorageService } from '../repositories/documents/storage';
import { prisma } from '../db/prisma';

export class DocumensoSdk extends Documenso {
  private storageService: StorageService;

  constructor(config: typeof env) {
    invariant(config.DOCUMENSO_API_KEY, 'DOCUMENSO_API_KEY is required');
    try {
      super({
        apiKey: config.DOCUMENSO_API_KEY,
      });
      this.storageService = new StorageService();
    } catch (error) {
      console.error('Error instantiating DocumensoSdk:', error);
      throw error;
    }
  }

  getSignatureUrl(token: string) {
    if (!token) {
      return null;
    }
    return `https://app.documenso.com/sign/${token}`;
  }

  /**
   * Get document details including download URL
   * @param documentId - The Documenso document ID
   * @returns Promise with document details
   */
  async getDocumentDetails(documentId: string) {
    try {
      const document = await this.documents.get({
        documentId: parseInt(documentId, 10),
      });

      return document;
    } catch (error) {
      console.error('Error getting document details:', error);
      throw new Error(`Failed to get document details: ${error}`);
    }
  }

  /**
   * Download a signed document PDF using the Documenso API
   * @param documentId - The Documenso document ID
   * @returns Promise<Response> - The PDF as a Response object
   */
  async downloadSignedDocument(documentId: string): Promise<Response> {
    try {
      // First, get the download URL from Documenso API
      const response = await fetch(
        `https://app.documenso.com/api/v1/documents/${documentId}/download`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${env.DOCUMENSO_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get download URL: ${response.status} ${response.statusText}`
        );
      }

      // Parse the JSON response to get the downloadUrl
      const data = (await response.json()) as { downloadUrl?: string };

      if (!data.downloadUrl) {
        throw new Error('No download URL found in response');
      }

      // Now fetch the actual PDF from the presigned URL
      const pdfResponse = await fetch(data.downloadUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/pdf',
        },
      });

      if (!pdfResponse.ok) {
        throw new Error(
          `Failed to download PDF: ${pdfResponse.status} ${pdfResponse.statusText}`
        );
      }

      return pdfResponse;
    } catch (error) {
      console.error('Error downloading signed document:', error);
      throw new Error(`Failed to download document: ${error}`);
    }
  }

  /**
   * Get document download URL
   * @param documentId - The Documenso document ID
   * @returns Promise<string> - The download URL
   */
  async getDocumentDownloadUrl(documentId: string): Promise<string> {
    try {
      const document = await this.getDocumentDetails(documentId);

      // Check if document is completed (signed)
      if (document.status !== 'COMPLETED') {
        throw new Error('Document is not completed yet');
      }

      // Get the download URL from Documenso API
      const response = await fetch(
        `https://app.documenso.com/api/v1/documents/${documentId}/download`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${env.DOCUMENSO_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get download URL: ${response.status} ${response.statusText}`
        );
      }

      // Parse the JSON response to get the downloadUrl
      const data = (await response.json()) as { downloadUrl?: string };

      if (!data.downloadUrl) {
        throw new Error('No download URL found in response');
      }

      return data.downloadUrl;
    } catch (error) {
      console.error('Error getting document download URL:', error);
      throw new Error(`Failed to get download URL: ${error}`);
    }
  }

  /**
   * Download and store a signed document to GCP storage
   * @param documentId - The Documenso document ID
   * @param fileName - Optional custom file name, defaults to `documenso-${documentId}.pdf`
   * @returns Promise<{ success: boolean; fileUrl?: string; error?: string }>
   */
  async downloadAndStoreDocument(
    recipientId: string,
    documentId: string,
    fileName?: string
  ): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
    try {
      // First check if document is completed
      const document = await this.getDocumentDetails(documentId);

      if (document.status !== 'COMPLETED') {
        return {
          success: false,
          error: 'Document is not completed yet',
        };
      }

      // Download the document
      const response = await this.downloadSignedDocument(documentId);
      const pdfBuffer = await response.arrayBuffer();

      // Generate file name if not provided
      const finalFileName = fileName || `documenso-${documentId}.pdf`;

      // Store to private bucket
      const success = await this.storageService.saveFile(
        'private',
        finalFileName,
        Buffer.from(pdfBuffer)
      );

      if (success) {
        // Add the key to the document recipient for future reference
        await prisma.documentRecipient.update({
          where: {
            id: recipientId,
          },
          data: {
            storageKey: finalFileName,
          },
        });
        // Generate a signed URL for reading the file
        const fileUrl = await this.storageService.generateReadSignedUrl(
          'private',
          finalFileName,
          { expires: Date.now() + 24 * 60 * 60 * 1000 } // 24 hours
        );

        return {
          success: true,
          fileUrl,
        };
      } else {
        return {
          success: false,
          error: 'Failed to save file to storage',
        };
      }
    } catch (error) {
      console.error('Error downloading and storing document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
