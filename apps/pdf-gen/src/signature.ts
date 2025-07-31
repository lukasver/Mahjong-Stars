import { Documenso } from '@documenso/sdk-typescript';
import {
  DocumentCreateDocumentTemporaryDistributionMethodRequest,
  DocumentRole,
  DocumentSigningOrder,
  type DocumentCreateDocumentTemporaryMeta,
  type DocumentRecipient,
} from '@documenso/sdk-typescript/models/operations/documentcreatedocumenttemporary.js';
import type { FieldCreateDocumentFieldsFieldUnion } from '@documenso/sdk-typescript/models/operations/fieldcreatedocumentfields.js';

class DocumensoService {
  private sdk: Documenso;
  private APPROVER: string | null = null;

  constructor() {
    if (!process.env.DOCUMENSO_API_KEY) {
      throw new Error('DOCUMENSO_API_KEY is not set');
    }
    this.sdk = new Documenso({
      apiKey: process.env.DOCUMENSO_API_KEY,
    });
    if (process.env.DOCUMENT_APPROVER_EMAIL) {
      this.APPROVER = process.env.DOCUMENT_APPROVER_EMAIL;
    }
  }

  // First create the document in the provider, signers and compute fields.
  async createDocumentInProvider({
    title,
    recipients,
    meta,
    file,
    pageSize,
    reference,
  }: {
    title: string;
    recipients: { email: string; name?: string }[];
    meta?: DocumentCreateDocumentTemporaryMeta;
    file: Buffer;
    pageSize: number;
    reference: string;
  }) {
    const signingOrder = DocumentSigningOrder.Sequential;
    try {
      const rec: Parameters<
        Documenso['documents']['createV0']
      >[0]['recipients'] = recipients.map((r, i) => ({
        name: r.name ?? '',
        email: r.email,
        role: DocumentRole.Signer,
        signingOrder: signingOrder === 'SEQUENTIAL' ? i : 0,
      }));
      if (this.APPROVER) {
        rec.push({
          name: 'Reviewer',
          email: this.APPROVER,
          role: DocumentRole.Viewer,
          signingOrder:
            signingOrder === 'SEQUENTIAL' ? recipients.length + 1 : 1,
        });
      }
      const res = await this.sdk.documents.createV0({
        title,
        recipients: rec,
        externalId: reference,
        meta: {
          timezone: meta?.timezone || 'Europe/Zurich',
          dateFormat: 'dd/MM/yyyy hh:mm a',
          language: meta?.language || 'en',
          subject: `Mahjonst Stars signature request`,
          message: `Please sign the document: ${title} by clicking on the link below`,
          emailSettings: {
            recipientRemoved: false,
          },
          signingOrder,
          distributionMethod:
            DocumentCreateDocumentTemporaryDistributionMethodRequest.Email,
        },
      });

      if (!res.uploadUrl) {
        throw new Error('Error generating document, no upload url');
      }

      await this.uploadFile(res.uploadUrl, {
        buffer: file,
        type: 'application/pdf',
      });

      const docId = res.document.id;

      const fields = this.calculateFields(res.document.recipients, pageSize);

      // Create the computed fields in the provider document
      const createFields = await this.sdk.documents.fields.createMany({
        documentId: docId,
        fields,
      });

      // If no fields were created, throw an error
      if (!createFields.fields?.length) {
        throw new Error('Failed to create fields');
      }

      return {
        documentId: docId,
        fields: createFields.fields,
      };
    } catch (error) {
      console.error('Error creating document in provider:', error);
      //TODO! maybe implement retry logic?
      throw error;
    }
  }

  // Send the document for signing
  async sendForDocumentSigning(documentId: number) {
    try {
      return this.sdk.documents.distribute({
        documentId,
        meta: {
          distributionMethod: 'EMAIL',
        },
      });
    } catch (error) {
      console.error('Error sending document for signing:', error);
      throw error;
    }
  }

  /**
   * Compute signature fields in the bottom of the document pages.
   */
  private calculateFields(recipients: DocumentRecipient[], pageSize: number) {
    // Field dimensions as percentage of page
    const width = 18; // 18% of page width
    const height = 3.5; // 3.5% of page height

    // Base positioning
    const basePageY = 88; // Base Y position for signatures (bottom of page)
    const spacing = 2; // Spacing between signature blocks (percentage)

    // Calculate field positions based on number of recipients
    const recipientCount = recipients.length;
    if (recipientCount > 5) {
      throw new Error('Maximum of 5 signers allowed per document');
    }

    // Calculate total width needed for all signatures
    const totalWidthNeeded =
      recipientCount * width + (recipientCount - 1) * spacing;

    // Maximum number of recipients we want to accommodate
    const maxRecipients = 5;

    // Calculate starting X position:
    // - If less than 5 recipients, align to right side
    // - Otherwise, center the signature block
    let startX = 0;
    if (recipientCount < maxRecipients) {
      // Right-align: start from right edge and move left. Substract spacing for proper margin
      startX = 100 - totalWidthNeeded - spacing;
    } else {
      // Center-align
      startX = (100 - totalWidthNeeded) / 2;
    }

    // Ensure startX is never negative
    startX = Math.max(0, startX);

    const fields: FieldCreateDocumentFieldsFieldUnion[] = [];

    // Create signature and email fields for each recipient
    recipients.forEach((rec, index) => {
      // Cannot add fields for CC or VIEWER roles
      if (rec.role === DocumentRole.Viewer) {
        return;
      }

      // Calculate X position for this recipient's fields
      const pageX = startX + index * (width + spacing);

      // Add signature fields on each page
      for (let page = 1; page <= pageSize; page++) {
        // Add signature field (on top of email)
        fields.push({
          recipientId: rec.id,
          type: 'SIGNATURE',
          pageNumber: page,
          pageX,
          pageY: basePageY,
          height,
          width,
        });

        // Add email field (below signature)
        fields.push({
          recipientId: rec.id,
          type: 'EMAIL',
          pageNumber: page,
          pageX,
          pageY: basePageY + height + 1, // 1% spacing between signature and email
          height,
          width,
        });
      }
    });

    return fields;
  }

  // Upload PDF file to the provider
  private uploadFile = async (
    url: string,
    file: File | { buffer: ArrayBuffer; type: 'application/pdf' }
  ) => {
    return fetch(url, {
      method: 'PUT',
      body: file instanceof File ? file : file.buffer,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    });
  };
}

export default new DocumensoService();
