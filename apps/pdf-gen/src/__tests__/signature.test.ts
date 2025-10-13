import type { DocumentRecipient } from '@documenso/sdk-typescript/models/operations/documentcreatedocumenttemporary.js';
import { DocumentRole } from '@documenso/sdk-typescript/models/operations/documentcreatedocumenttemporary.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the Documenso SDK
vi.mock('@documenso/sdk-typescript', () => ({
  Documenso: vi.fn().mockImplementation(() => ({
    documents: {
      createV0: vi.fn(),
      fields: {
        createMany: vi.fn(),
      },
      distribute: vi.fn(),
    },
  })),
  DocumentRole: {
    Signer: 'SIGNER',
    Approver: 'APPROVER',
    Cc: 'CC',
    Viewer: 'VIEWER',
  },
  DocumentSigningOrder: {
    Sequential: 'SEQUENTIAL',
  },
}));

// Import the service after mocking
import Documenso, { DocumensoService } from '../signature.js';

describe('DocumensoService', () => {
  let documensoService: DocumensoService;

  beforeEach(() => {
    // Reset environment variables
    process.env.DOCUMENSO_API_KEY = 'test-api-key';
    process.env.DOCUMENT_CC_EMAIL = 'test@example.com';
    process.env.SIGN_LAST_PAGE_ONLY = 'false';

    // Get the singleton instance
    documensoService = Documenso;
  });

  describe('calculateFields method', () => {
    const createMockRecipient = (
      id: number,
      email: string,
      role: DocumentRole,
      name?: string
    ) =>
      ({
        id,
        email,
        role,
        name: name || '',
        signingOrder: 0,
      } as DocumentRecipient);

    it('should throw error when more than 1 approver is provided', () => {
      const recipients = [
        createMockRecipient(1, 'approver1@test.com', DocumentRole.Approver),
        createMockRecipient(2, 'approver2@test.com', DocumentRole.Approver),
      ];
      expect(() => {
        // Access private method through bracket notation for testing
        documensoService.calculateFields(recipients, 1);
      }).toThrow('Maximum of 1 approver allowed per document');
    });

    it('should throw error when more than 5 recipients are provided', () => {
      const recipients = [
        createMockRecipient(1, 'signer1@test.com', DocumentRole.Signer),
        createMockRecipient(2, 'signer2@test.com', DocumentRole.Signer),
        createMockRecipient(3, 'signer3@test.com', DocumentRole.Signer),
        createMockRecipient(4, 'signer4@test.com', DocumentRole.Signer),
        createMockRecipient(5, 'signer5@test.com', DocumentRole.Signer),
        createMockRecipient(6, 'signer6@test.com', DocumentRole.Signer),
      ];
      expect(() => {
        documensoService.calculateFields(recipients, 1);
      }).toThrow('Maximum of 5 recipients allowed per document');
    });

    it('should create fields for a single signer on single page', () => {
      const recipients = [
        createMockRecipient(1, 'signer@test.com', DocumentRole.Signer),
      ];

      const [fields] = documensoService.calculateFields(recipients, 1);
      expect(fields).toHaveLength(2); // 1 signature + 1 email field
      const signatureField = fields[0];
      const emailField = fields[1];
      expect(signatureField).toHaveProperty('type', 'SIGNATURE');
      expect(signatureField).toHaveProperty('pageX', 88);
      expect(signatureField).toHaveProperty('pageY', 88);
      expect(emailField).toHaveProperty('type', 'EMAIL');
      expect(emailField).toHaveProperty('pageX', 88);
      expect(emailField).toHaveProperty('pageY', 88 + 3.5 + 2);
    });

    it('should create fields for a single signer on multiple pages', () => {
      process.env.SIGN_LAST_PAGE_ONLY = 'false';
      const recipients = [
        createMockRecipient(1, 'signer@test.com', DocumentRole.Signer),
      ];
      const [fields] = documensoService.calculateFields(recipients, 3);

      expect(fields).toHaveLength(6); // 2 fields per page × 3 pages

      // Check that fields are created for each page
      const pageNumbers = fields.map((field) => field.pageNumber);
      expect(pageNumbers).toEqual([1, 1, 2, 2, 3, 3]);
    });

    it('should create fields for approver and signer', () => {
      const recipients = [
        createMockRecipient(1, 'approver@test.com', DocumentRole.Approver),
        createMockRecipient(2, 'signer@test.com', DocumentRole.Signer),
      ];

      const [fields] = documensoService.calculateFields(recipients, 1);
      expect(fields).toHaveLength(4); // 2 fields per recipient

      const approverFields = fields.slice(0, 2);
      expect(approverFields).toHaveLength(2);
      expect(approverFields.every((field) => field.recipientId === 1)).toBe(
        true
      );
      const signerFields = fields.slice(2);
      expect(signerFields).toHaveLength(2);
      expect(signerFields.every((field) => field.recipientId === 2)).toBe(true);

      const approverField = approverFields[0];
      const signerField = signerFields[0];
      expect(approverField).toHaveProperty('type', 'SIGNATURE');
      expect(approverField).toHaveProperty('pageX', 12);
      expect(approverField).toHaveProperty('pageY', 88);
      expect(signerField).toHaveProperty('type', 'SIGNATURE');
      expect(signerField).toHaveProperty('pageX', 88);
      expect(signerField).toHaveProperty('pageY', 88);
    });

    it('should respect SIGN_LAST_PAGE_ONLY environment variable', () => {
      process.env.SIGN_LAST_PAGE_ONLY = 'true';

      const recipients = [
        createMockRecipient(1, 'signer@test.com', DocumentRole.Signer),
      ];

      const [fields] = documensoService.calculateFields(recipients, 3);

      // Should only create fields for the last page
      expect(fields).toHaveLength(2); // 2 fields only on last page
      expect(fields.every((field) => field.pageNumber === 3)).toBe(true);
    });

    it.only('should handle multiple signers correctly', () => {
      const recipients = [
        createMockRecipient(1, 'signer1@test.com', DocumentRole.Signer),
        createMockRecipient(2, 'signer2@test.com', DocumentRole.Signer),
        createMockRecipient(3, 'signer3@test.com', DocumentRole.Signer),
      ];

      const [fields, config] = documensoService.calculateFields(recipients, 1);

      expect(fields).toHaveLength(recipients.length * 2); // 2 fields per signer

      // Check that each signer has signature and email fields
      const signer1Fields = fields.filter((field) => field.recipientId === 1);
      const signer2Fields = fields.filter((field) => field.recipientId === 2);
      const signer3Fields = fields.filter((field) => field.recipientId === 3);

      expect(signer1Fields).toHaveLength(2);
      expect(signer2Fields).toHaveLength(2);
      expect(signer3Fields).toHaveLength(2);

      // Should have correctly positioned fields
      fields.forEach((f, i) => {
        console.debug('x', f.pageX, 'y', f.pageY);
        const mod = i % 2;
        const pageX =
          100 - config.MARGIN_X - i * (config.FIELD_WIDTH + config.SPACING);
        const pageY =
          config.BASE_PAGE_Y +
          (!mod ? 0 : config.FIELD_HEIGHT + config.SPACING);
        expect(f).toHaveProperty('pageX', pageX);
        expect(f).toHaveProperty('pageY', pageY);
      });
    });

    it('should position fields correctly for different scenarios', () => {
      const recipients = [
        createMockRecipient(1, 'signer@test.com', DocumentRole.Signer),
      ];

      const [fields] = documensoService.calculateFields(recipients, 1);

      // Check that email field is positioned below signature field
      const signatureField = fields.find((field) => field.type === 'SIGNATURE');
      const emailField = fields.find((field) => field.type === 'EMAIL');

      expect(signatureField?.pageY).toBe(88); // BASE_PAGE_Y
      expect(emailField?.pageY).toBe(88 + 3.5 + 1); // BASE_PAGE_Y + FIELD_HEIGHT + 1
    });
  });

  describe('constructor', () => {
    it('should throw error when DOCUMENSO_API_KEY is not set', () => {
      delete process.env.DOCUMENSO_API_KEY;

      expect(() => {
        new DocumensoService();
      }).toThrow('DOCUMENSO_API_KEY is not set');
    });

    it('should initialize successfully with valid API key', () => {
      process.env.DOCUMENSO_API_KEY = 'valid-api-key';

      expect(() => {
        new DocumensoService();
      }).not.toThrow();
    });

    it('should set REVIEWER when DOCUMENT_CC_EMAIL is provided', () => {
      process.env.DOCUMENSO_API_KEY = 'valid-api-key';
      process.env.DOCUMENT_CC_EMAIL = 'reviewer@test.com';

      const service = new DocumensoService();
      expect((service as any).REVIEWER).toBe('reviewer@test.com');
    });
  });
});
