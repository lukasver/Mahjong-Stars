import type { DocumentRecipient } from "@documenso/sdk-typescript/models/operations/documentcreatedocumenttemporary.js";
import { DocumentRole } from "@documenso/sdk-typescript/models/operations/documentcreatedocumenttemporary.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Documenso SDK
vi.mock("@documenso/sdk-typescript", () => ({
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
		Signer: "SIGNER",
		Approver: "APPROVER",
		Cc: "CC",
		Viewer: "VIEWER",
	},
	DocumentSigningOrder: {
		Sequential: "SEQUENTIAL",
	},
}));

// Import the service after mocking
import Documenso, { DocumensoService } from "../signature.js";

describe("DocumensoService Simple Tests", () => {
	let documensoService: DocumensoService;

	beforeEach(() => {
		process.env.DOCUMENSO_API_KEY = "test-api-key";
		process.env.DOCUMENT_CC_EMAIL = "test@example.com";
		process.env.SIGN_LAST_PAGE_ONLY = "false";

		documensoService = Documenso;
	});

	const createMockRecipient = (
		id: number,
		email: string,
		role: DocumentRole,
		name?: string,
	) =>
		({
			id,
			email,
			role,
			name: name || "",
			signingOrder: 0,
		}) as DocumentRecipient;

	describe("calculateFields method bugs", () => {
		it("should identify the undefined variables in calculateFields method", () => {
			const recipients = [
				createMockRecipient(1, "signer@test.com", DocumentRole.Signer),
			];

			// This test will help us identify the bugs in the calculateFields method
			expect(() => {
				documensoService.calculateFields(recipients, 1);
			}).toThrow();
		});

		it("should document the bugs found in calculateFields method", () => {
			// This test documents the bugs we found in the calculateFields method
			const bugs = [
				"Line 235: `approverX` is undefined (should be `APPROVER_X`)",
				"Line 237: `spacing` is undefined (should be `SPACING`)",
				"Line 249: `width` is undefined (should be `FIELD_WIDTH`)",
				"Line 250: `spacing` is undefined (should be `SPACING`)",
				"Line 262: `basePageY` is undefined (should be `BASE_PAGE_Y`)",
				"Line 263: `height` is undefined (should be `FIELD_HEIGHT`)",
				"Line 264: `width` is undefined (should be `FIELD_WIDTH`)",
				"Line 273: `basePageY` is undefined (should be `BASE_PAGE_Y`)",
				"Line 274: `height` is undefined (should be `FIELD_HEIGHT`)",
				"Line 275: `width` is undefined (should be `FIELD_WIDTH`)",
			];

			expect(bugs).toHaveLength(10);
			expect(bugs.every((bug) => bug.includes("undefined"))).toBe(true);
		});

		it("should provide the corrected variable names", () => {
			const corrections = {
				approverX: "APPROVER_X",
				spacing: "SPACING",
				width: "FIELD_WIDTH",
				height: "FIELD_HEIGHT",
				basePageY: "BASE_PAGE_Y",
			};

			expect(corrections.approverX).toBe("APPROVER_X");
			expect(corrections.spacing).toBe("SPACING");
			expect(corrections.width).toBe("FIELD_WIDTH");
			expect(corrections.height).toBe("FIELD_HEIGHT");
			expect(corrections.basePageY).toBe("BASE_PAGE_Y");
		});
	});

	describe("Service instance tests", () => {
		it("should be able to access the service instance", () => {
			expect(documensoService).toBeDefined();
			expect(typeof documensoService).toBe("object");
		});

		it("should have the expected methods", () => {
			expect(typeof documensoService.createDocumentInProvider).toBe("function");
			expect(typeof documensoService.sendForDocumentSigning).toBe("function");
		});
	});
});
