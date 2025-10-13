import { beforeEach, describe, expect, it, vi } from "vitest";
import { testScenarios } from "./fixtures.js";

// Mock the Documenso SDK
const mockCreateV0 = vi.fn();
const mockCreateMany = vi.fn();
const mockDistribute = vi.fn();

vi.mock("@documenso/sdk-typescript", () => ({
	Documenso: vi.fn().mockImplementation(() => ({
		documents: {
			createV0: mockCreateV0,
			fields: {
				createMany: mockCreateMany,
			},
			distribute: mockDistribute,
		},
	})),
	DocumentRole: {
		Signer: "SIGNER",
		Approver: "APPROVER",
		Cc: "CC",
		Viewer: "VIEWER",
	},
	DocumentSigningOrder: {
		Sequential: "SEQUENTIAL",
	},
}));

// Mock the generatePdf function
vi.mock("../generate.js", () => ({
	generatePdf: vi.fn().mockResolvedValue({
		pageCount: 2,
		buffer: Buffer.from("mock-pdf-content"),
	}),
}));

// Mock the callWebhook function
vi.mock("../callWebhook.js", () => ({
	callWebhook: vi.fn().mockResolvedValue(undefined),
}));

// Import after mocking
import Documenso, { DocumensoService } from "../signature.js";

describe("DocumensoService Integration Tests", () => {
	let documensoService: DocumensoService;

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Setup environment
		process.env.DOCUMENSO_API_KEY = "test-api-key";
		process.env.DOCUMENT_CC_EMAIL = "reviewer@test.com";
		process.env.SIGN_LAST_PAGE_ONLY = "false";

		// Setup mock responses
		mockCreateV0.mockResolvedValue({
			uploadUrl: "https://mock-upload-url.com",
			document: {
				id: 123,
				recipients: testScenarios.singleSigner.map((recipient) => ({
					...recipient,
					id: recipient.id,
				})),
			},
		});

		mockCreateMany.mockResolvedValue({
			fields: [
				{ id: 1, type: "SIGNATURE", recipientId: 1 },
				{ id: 2, type: "EMAIL", recipientId: 1 },
			],
		});

		mockDistribute.mockResolvedValue({
			status: "SENT",
			externalId: "test-external-id",
		});

		// Mock fetch for file upload
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
		});

		documensoService = Documenso;
	});

	describe("createDocumentInProvider", () => {
		it("should create document with single signer successfully", async () => {
			const result = await documensoService.createDocumentInProvider({
				title: "Test Document",
				recipients: testScenarios.singleSigner,
				file: Buffer.from("test-pdf-content"),
				pageSize: 2,
				reference: "test-ref-123",
			});

			expect(result).toMatchObject({
				documentId: 123,
				fields: expect.arrayContaining([
					expect.objectContaining({ type: "SIGNATURE" }),
					expect.objectContaining({ type: "EMAIL" }),
				]),
			});

			// Verify API calls were made
			expect(mockCreateV0).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Test Document",
					externalId: "test-ref-123",
					recipients: expect.arrayContaining([
						expect.objectContaining({
							email: "signer@test.com",
							role: "SIGNER",
						}),
					]),
				}),
			);

			expect(mockCreateMany).toHaveBeenCalledWith({
				documentId: 123,
				fields: expect.any(Array),
			});

			expect(global.fetch).toHaveBeenCalledWith(
				"https://mock-upload-url.com",
				expect.objectContaining({
					method: "PUT",
					body: expect.any(Buffer),
				}),
			);
		});

		it("should create document with approver and signer", async () => {
			const result = await documensoService.createDocumentInProvider({
				title: "Test Document with Approver",
				recipients: testScenarios.approverAndSigner,
				file: Buffer.from("test-pdf-content"),
				pageSize: 1,
				reference: "test-ref-456",
			});

			expect(result.documentId).toBe(123);
			expect(result.fields).toHaveLength(4); // 2 fields per recipient

			// Verify recipients are sorted correctly (signers first)
			expect(mockCreateV0).toHaveBeenCalledWith(
				expect.objectContaining({
					recipients: expect.arrayContaining([
						expect.objectContaining({ role: "SIGNER" }),
						expect.objectContaining({ role: "APPROVER" }),
						expect.objectContaining({ role: "CC" }), // CC from environment
					]),
				}),
			);
		});

		it("should handle multiple pages correctly", async () => {
			const result = await documensoService.createDocumentInProvider({
				title: "Multi-page Document",
				recipients: testScenarios.singleSigner,
				file: Buffer.from("test-pdf-content"),
				pageSize: 3,
				reference: "test-ref-789",
			});

			expect(result.documentId).toBe(123);

			// Should create fields for each page
			const fields = mockCreateMany.mock.calls[0][0].fields;
			const pageNumbers = fields.map((field: any) => field.pageNumber);
			expect(pageNumbers).toEqual([1, 1, 2, 2, 3, 3]); // 2 fields per page
		});

		it("should respect SIGN_LAST_PAGE_ONLY setting", async () => {
			process.env.SIGN_LAST_PAGE_ONLY = "true";

			const result = await documensoService.createDocumentInProvider({
				title: "Last Page Only Document",
				recipients: testScenarios.singleSigner,
				file: Buffer.from("test-pdf-content"),
				pageSize: 3,
				reference: "test-ref-last-page",
			});

			expect(result.documentId).toBe(123);

			// Should only create fields for the last page
			const fields = mockCreateMany.mock.calls[0][0].fields;
			const pageNumbers = fields.map((field: any) => field.pageNumber);
			expect(pageNumbers).toEqual([3, 3]); // Only last page
		});

		it("should throw error when upload URL is not provided", async () => {
			mockCreateV0.mockResolvedValueOnce({
				uploadUrl: null,
				document: { id: 123, recipients: [] },
			});

			await expect(
				documensoService.createDocumentInProvider({
					title: "Test Document",
					recipients: testScenarios.singleSigner,
					file: Buffer.from("test-pdf-content"),
					pageSize: 1,
					reference: "test-ref-error",
				}),
			).rejects.toThrow("Error generating document, no upload url");
		});

		it("should throw error when field creation fails", async () => {
			mockCreateMany.mockResolvedValueOnce({
				fields: [], // No fields created
			});

			await expect(
				documensoService.createDocumentInProvider({
					title: "Test Document",
					recipients: testScenarios.singleSigner,
					file: Buffer.from("test-pdf-content"),
					pageSize: 1,
					reference: "test-ref-fields-error",
				}),
			).rejects.toThrow("Failed to create fields");
		});
	});

	describe("sendForDocumentSigning", () => {
		it("should send document for signing successfully", async () => {
			const result = await documensoService.sendForDocumentSigning(123);

			expect(result).toEqual({
				status: "SENT",
				externalId: "test-external-id",
			});

			expect(mockDistribute).toHaveBeenCalledWith({
				documentId: 123,
				meta: {
					distributionMethod: "EMAIL",
				},
			});
		});

		it("should handle distribution errors", async () => {
			mockDistribute.mockRejectedValueOnce(new Error("Distribution failed"));

			await expect(
				documensoService.sendForDocumentSigning(123),
			).rejects.toThrow("Distribution failed");
		});
	});
});
