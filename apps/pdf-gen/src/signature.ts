import { Documenso } from "@documenso/sdk-typescript";
import {
	DocumentCreateDocumentTemporaryDistributionMethodRequest,
	type DocumentCreateDocumentTemporaryMeta,
	type DocumentRecipient,
	DocumentRole,
	DocumentSigningOrder,
} from "@documenso/sdk-typescript/models/operations/documentcreatedocumenttemporary.js";
import type { FieldCreateDocumentFieldsFieldUnion } from "@documenso/sdk-typescript/models/operations/fieldcreatedocumentfields.js";

export class DocumensoService {
	private sdk: Documenso;
	private REVIEWER: string | null = null;

	constructor() {
		if (!process.env.DOCUMENSO_API_KEY) {
			throw new Error("DOCUMENSO_API_KEY is not set");
		}
		this.sdk = new Documenso({
			apiKey: process.env.DOCUMENSO_API_KEY,
		});
		if (process.env.DOCUMENT_CC_EMAIL) {
			this.REVIEWER = process.env.DOCUMENT_CC_EMAIL;
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
		redirectUrl,
		transactionId,
	}: {
		title: string;
		recipients: { email: string; name?: string; role: DocumentRole }[];
		meta?: DocumentCreateDocumentTemporaryMeta;
		file: Buffer;
		pageSize: number;
		reference: string;
		redirectUrl?: string;
		transactionId?: string;
	}) {
		const signingOrder = DocumentSigningOrder.Sequential;
		try {
			const rec: Parameters<
				Documenso["documents"]["createV0"]
			>[0]["recipients"] = recipients
				.sort((a, b) => {
					// Sort Signers first
					const roleA = a.role ?? DocumentRole.Signer;
					const roleB = b.role ?? DocumentRole.Signer;
					if (roleA === DocumentRole.Signer && roleB !== DocumentRole.Signer) {
						return -1;
					}
					if (roleA !== DocumentRole.Signer && roleB === DocumentRole.Signer) {
						return 1;
					}
					return 0;
				})
				.map((r, i) => ({
					name: r.name ?? "",
					email: r.email,
					role: r.role ?? DocumentRole.Signer,
					signingOrder: signingOrder === "SEQUENTIAL" ? i : 0,
				}));
			if (this.REVIEWER) {
				rec.push({
					name: "Reviewer",
					email: this.REVIEWER,
					role: DocumentRole.Cc,
					signingOrder:
						signingOrder === "SEQUENTIAL" ? recipients.length + 1 : 1,
				});
			}

			const companyName = process.env.COMPANY_NAME || "The Tiles Company";
			const redirectTo = redirectUrl || ((process.env.PDF_REDIRECT_BASE_URL && transactionId) ? `${process.env.PDF_REDIRECT_BASE_URL}/dashboard/buy/${transactionId}` : undefined);

			console.log("🚀 ~ signature.ts:83 ~ redirectTo:", redirectTo);


			const res = await this.sdk.documents.createV0({
				title,
				recipients: rec,
				externalId: reference,
				meta: {
					...(redirectTo && { redirectUrl: redirectTo }),
					timezone: meta?.timezone || "Europe/Zurich",
					dateFormat: "dd/MM/yyyy hh:mm a",
					language: meta?.language || "en",
					subject: `${companyName} signature request`,
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
				throw new Error("Error generating document, no upload url");
			}

			await this.uploadFile(res.uploadUrl, {
				buffer: file,
				type: "application/pdf",
			});

			const docId = res.document.id;

			const [fields] = this.calculateFields(
				// Do not include CC in the fields since it's not a signer
				res.document.recipients.filter((r) => r.role !== DocumentRole.Cc),
				pageSize,
			);

			// Create the computed fields in the provider document
			const createFields = await this.sdk.documents.fields.createMany({
				documentId: docId,
				fields,
			});

			// If no fields were created, throw an error
			if (!createFields.fields?.length) {
				throw new Error("Failed to create fields");
			}

			return {
				documentId: docId,
				fields: createFields.fields,
			};
		} catch (error) {
			console.error("Error creating document in provider:", error);
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
					distributionMethod: "EMAIL",
				},
			});
		} catch (error) {
			console.error("Error sending document for signing:", error);
			throw error;
		}
	}

	/**
	 * Compute signature fields in the bottom of the document pages.
	 */
	calculateFields(recipients: DocumentRecipient[], pageSize: number) {
		const SIGN_LAST_PAGE_ONLY = process.env.SIGN_LAST_PAGE_ONLY === "true";

		// Base positioning
		const WIDTH = 100;
		const MAX_RECIPIENTS = 5;
		const BASE_PAGE_Y = 88; // Base Y position for signatures (bottom of page)
		const SPACING = 2; // Spacing between signature blocks (percentage)
		// Field dimensions as percentage of page
		const FIELD_WIDTH =
			WIDTH / MAX_RECIPIENTS -
			(SPACING * (MAX_RECIPIENTS + 1)) / MAX_RECIPIENTS;

		const FIELD_HEIGHT = 3.5; // 3.5% of page height

		const MARGIN_RIGHT = Math.round((FIELD_WIDTH + SPACING) * 10) / 10; // side margin for the page

		const config = {
			FIELD_WIDTH,
			FIELD_HEIGHT,
			BASE_PAGE_Y,
			MARGIN_RIGHT,
			WIDTH,
			SPACING,
			SIGN_LAST_PAGE_ONLY,
		};

		// | - - - - - |

		// Separate APPROVER from other recipients
		const approverRecipients = recipients.filter(
			(rec) => rec.role === DocumentRole.Approver,
		);
		const signerRecipients = recipients.filter(
			(rec) => rec.role === DocumentRole.Signer,
		);

		// Validate that there's at most one APPROVER
		if (approverRecipients.length > 1) {
			throw new Error("Maximum of 1 approver allowed per document");
		}

		// Calculate field positions based on number of signers (excluding approver)
		const signerCount = signerRecipients.length;
		if (recipients.length > 5) {
			throw new Error("Maximum of 5 recipients allowed per document");
		}

		const fields: FieldCreateDocumentFieldsFieldUnion[] = [];
		// Position APPROVER on the far left side (opposite to signers)

		// Handle APPROVER positioning (far left side)
		if (approverRecipients.length > 0) {
			const approver = approverRecipients[0];

			// Add signature fields for APPROVER on each page
			for (let page = 1; page <= pageSize; page++) {
				if (SIGN_LAST_PAGE_ONLY && page !== pageSize) {
					continue;
				}
				// Add signature field (on top of email)
				fields.push({
					recipientId: approver.id,
					type: "SIGNATURE",
					pageNumber: page,
					pageX: SPACING,
					pageY: BASE_PAGE_Y,
					height: FIELD_HEIGHT,
					width: FIELD_WIDTH,
				});

				// Add email field (below signature)
				fields.push({
					recipientId: approver.id,
					type: "EMAIL",
					pageNumber: page,
					pageX: SPACING,
					pageY: BASE_PAGE_Y + FIELD_HEIGHT + SPACING, // spacing between signature and email
					height: FIELD_HEIGHT,
					width: FIELD_WIDTH,
				});
			}
		}

		// Handle regular signers positioning (right side)
		if (signerCount > 0) {
			// Calculate starting X position for signers:

			const FAR_RIGHT = WIDTH - MARGIN_RIGHT;

			// Create signature and email fields for each signer
			signerRecipients.forEach((rec, index) => {
				// Calculate X position for this signer's fields
				const pageX =
					index === 0 ? FAR_RIGHT : FAR_RIGHT - index * (FIELD_WIDTH + SPACING);

				// Add signature fields on each page
				for (let page = 1; page <= pageSize; page++) {
					if (SIGN_LAST_PAGE_ONLY && page !== pageSize) {
						continue;
					}
					// Add signature field (on top of email)
					fields.push({
						recipientId: rec.id,
						type: "SIGNATURE",
						pageNumber: page,
						pageX,
						pageY: BASE_PAGE_Y,
						height: FIELD_HEIGHT,
						width: FIELD_WIDTH,
					});

					// Add email field (below signature)
					fields.push({
						recipientId: rec.id,
						type: "EMAIL",
						pageNumber: page,
						pageX,
						pageY: BASE_PAGE_Y + FIELD_HEIGHT + SPACING,
						height: FIELD_HEIGHT,
						width: FIELD_WIDTH,
					});
				}
			});
		}

		return [fields, config] as const;
	}

	// Upload PDF file to the provider
	private uploadFile = async (
		url: string,
		file: File | { buffer: ArrayBuffer; type: "application/pdf" },
	) => {
		return fetch(url, {
			method: "PUT",
			body: file instanceof File ? file : file.buffer,
			headers: {
				"Content-Type": file.type || "application/octet-stream",
			},
		});
	};
}

export default new DocumensoService();
