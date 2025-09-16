import "server-only";
import { invariant } from "@epic-web/invariant";
import {
	extensions,
	generateHTML,
	JSONContent,
} from "@mjs/utils/server/tiptap";
import { Prisma } from "@prisma/client";
import Handlebars from "handlebars";
import { DateTime } from "luxon";
import mime from "mime-types";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { env } from "@/common/config/env";
import { ActionCtx } from "@/common/schemas/dtos/sales";
import { Failure, Success } from "@/common/schemas/dtos/utils";
import { KycStatusSchema } from "@/common/schemas/generated";
import { prisma } from "@/db";
import logger from "@/lib/services/logger.server";
import contractController from "../contract";
import { StorageService } from "./storage";

class DocumentsController {
	private s3: StorageService;
	private contractController: typeof contractController;

	constructor(private readonly storage: StorageService) {
		this.s3 = this.storage;
		this.contractController = contractController;
	}

	// this.service.getDocumentPresignedUrl(user, payload)
	// this.service.createSignableDocumentFromJsonContent(user, payload)
	/**
	 * Create a template for a signable document. This helps AM creates a template that cannot be generated in Documenso yet due to missing variables.
	 * @param user
	 * @param dto
	 * @returns
	 */
	async createSaft(
		dto: {
			content: string | JSONContent;
			name: string;
			description?: string;
			saleId: string;
		},
		_ctx: ActionCtx,
	) {
		try {
			invariant(dto.saleId, "Sale ID is required");
			invariant(dto.content, "Content is required");
			// Check if sale already has a saft
			const sale = await prisma.sale.findUnique({
				where: {
					id: dto.saleId,
				},
				select: {
					name: true,
					saftContract: {
						select: {
							id: true,
							version: true,
							parentId: true,
							isCurrent: true,
						},
					},
				},
			});
			const existingSaft = sale?.saftContract;
			// Create saft in Database

			const newVersion = (existingSaft?.version || 0) + 1;
			const variables = this.extractHandlebarsVariables(dto.content);

			if (variables.some((v) => (v.match(/\./g) || []).length >= 2)) {
				throw new Error(
					"Variables can only be nested up to 1 level, example: {{recipient.email}}.",
				);
			}

			const newSaft = await prisma.$transaction(async (tx) => {
				const newSaft = await prisma.saftContract.create({
					data: {
						name:
							dto.name ||
							`${sale?.name} SAFT v${newVersion} - ${DateTime.now().toFormat(
								"yyyy-MM-dd",
							)}`,
						description: dto.description,
						content: dto.content,
						isCurrent: true,
						version: newVersion,
						// Always set the parentId to the original SAFT.
						parentId:
							newVersion === 1
								? null
								: existingSaft?.parentId || existingSaft?.id,
						Sale: {
							connect: {
								id: dto.saleId,
							},
						},
						variables,
					},
				});

				// Need to update the existing saft to be not current
				if (existingSaft) {
					await tx.saftContract.update({
						where: {
							id: existingSaft.id,
						},
						data: {
							isCurrent: {
								set: false,
							},
							saleId: null,
						},
					});
				}
				return newSaft;
			});

			return Success({ saft: newSaft });
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	/**
	 *
	 * @param key - file name with extension.
	 * @param expiresIn
	 * @returns
	 */
	async getPresignedUrl(
		key: string,
		bucket: "public" | "private",
		type: "read" | "write",
		expiresIn: number = 3600,
		// metadata?: Record<string, string>
	) {
		try {
			let url: string = "";
			let bucketName: string = "";
			if (type === "read") {
				const res = await this.s3.generateReadSignedUrl(bucket, key, {
					expires: expiresIn,
				});
				url = res.url;
				bucketName = res.bucket;
			}

			if (type === "write") {
				const res = await this.s3.getPresignedUrlForUpload({
					bucket,
					fileName: key,
					expiresInMinutes: expiresIn / 60,
				});
				url = res.url;
				bucketName = res.bucket;
			}
			return Success({
				url,
				prefix: `https://storage.googleapis.com/${bucketName}/`,
			});
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	async getDocumentById(
		id: string | string[],
		{ presignedUrl }: { presignedUrl?: boolean } = {},
		_ctx: ActionCtx,
	) {
		let documents = await prisma.document.findMany({
			where: {
				id: {
					in: Array.isArray(id) ? id : [id],
				},
			},
			select: {
				id: true,
				fileName: true,
				name: true,
			},
		});

		if (presignedUrl) {
			documents = await Promise.all(
				documents.map(async (d) => {
					return {
						...d,
						url: await this.s3.generateReadSignedUrl("private", d.fileName),
					};
				}),
			);
		}
		return Success({ documents });
	}

	async generatePDF(args: {
		content: string;
		title: string;
		recipients: Array<{
			email: string;
			name?: string;
		}>;
		reference: string;
	}) {
		const res = await fetch(env.PDF_SERVICE_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": env.PDF_SERVICE_API_KEY,
			},
			body: JSON.stringify(args),
		});

		if (!res.ok) {
			throw new Error(`Failed to generate PDF: ${res.statusText}`);
		}
		return res.json();
	}

	async associateDocumentsToUser(
		dto: {
			documents: {
				id?: string;
				key: string;
			}[];
			type: "KYC" | "PAYMENT";
			transactionId?: string;
		},
		_ctx: ActionCtx,
	) {
		const { documents, type = "KYC" } = dto;
		const { userId } = _ctx;
		let kycVerificationId: string | undefined;
		if (type === "KYC") {
			kycVerificationId = (
				await prisma.kycVerification.upsert({
					where: {
						userId,
					},
					create: {
						user: {
							connect: {
								id: userId,
							},
						},
					},
					update: {},
					select: {
						id: true,
					},
				})
			)?.id;
		}

		const shouldUpsert = z
			.object({
				id: z.string(),
				key: z.string(),
			})
			.array()
			.safeParse(documents);

		// If ID is present, we should update
		if (shouldUpsert.success) {
			const [docs] = await Promise.all([
				documents.map((d) => {
					return prisma.document.update({
						where: {
							id: d.id,
						},
						data: {
							fileName: d.key,
							type: mime.lookup(d.key) || "application/octet-stream",
							name: d.key.split("/").pop() || "",
							url: this.s3.getFileUrl("private", d.key),
						},
					});
				}),
			]);
			return Success({ documents: docs });
		} else {
			// Else we should create
			const promises = [];
			promises.push(
				prisma.document
					.createManyAndReturn({
						data: documents.map((d) => {
							const url = this.s3.getFileUrl("private", d.key);
							console.log("URL", url, d.key);
							return {
								userId,
								fileName: d.key,
								type: mime.lookup(d.key) || "application/octet-stream",
								name: d.key.split("/").pop() || "",
								url: this.s3.getFileUrl("private", d.key),
								...(kycVerificationId ? { kycVerificationId } : {}),
							} satisfies Prisma.DocumentCreateManyInput;
						}),
						skipDuplicates: true,
						select: {
							id: true,
						},
					})
					.then(async (docs) => {
						if (type === "PAYMENT" && docs[0]) {
							await prisma.saleTransactions.update({
								where: { id: dto.transactionId },
								data: { paymentEvidenceId: docs[0].id },
							});
						}

						return docs;
					}),
			);
			if (type === "KYC") {
				promises.push(
					prisma.kycVerification.upsert({
						where: {
							userId,
						},
						create: {
							user: {
								connect: {
									id: userId,
								},
							},
							status: KycStatusSchema.enum.SUBMITTED,
						},
						update: {
							status: KycStatusSchema.enum.SUBMITTED,
						},
					}),
				);
			}

			const [docs] = await Promise.all(promises);
			return Success({ documents: docs });
		}
	}

	private generateHTMLFromJSONContent = (content: JSONContent) => {
		if (!content || typeof content !== "object") {
			return "";
		}
		try {
			return generateHTML(content, extensions);
		} catch (error) {
			console.error("Error generating HTML from JSON content:", error);
			return "";
		}
	};

	private sanitizeHtmlContent = (
		_content: string | JSONContent,
		textOnly = true,
	) => {
		const parsed: string = "";
		let content: string = "";
		if (!_content) {
			return parsed;
		}
		if (typeof _content === "object") {
			content = this.generateHTMLFromJSONContent(_content);
		} else {
			content = _content;
		}

		return sanitizeHtml(content, {
			allowedTags: textOnly ? [] : [], // empty array means strip all HTML tags, todo add allowed tags
			allowedAttributes: {}, // no attributes allowed
			textFilter: function (text: string) {
				return text.trim(); // trim whitespace
			},
		});
	};

	/**
	 * Recursively walk the Handlebars AST and collect variable names.
	 * @param node The current AST node.
	 * @param variables The set to collect variable names.
	 */
	private collectVariablesFromDocument(node: unknown, variables: Set<string>) {
		if (!node || typeof node !== "object") return;

		const nodeObj = node as Record<string, unknown>;

		// Handle {{variable}} and {{{variable}}}
		if (
			nodeObj.type === "MustacheStatement" ||
			nodeObj.type === "SubExpression" ||
			nodeObj.type === "BlockStatement" ||
			nodeObj.type === "PartialStatement" ||
			nodeObj.type === "PartialBlockStatement" ||
			nodeObj.type === "DecoratorBlock" ||
			nodeObj.type === "Decorator"
		) {
			const path = nodeObj.path as Record<string, unknown>;
			if (path && path.original) {
				variables.add(path.original as string);
			}
		}

		if (nodeObj.type === "ContentStatement" && nodeObj.value) {
			// No variable here, just content
		}

		// Recursively process child nodes
		for (const key in nodeObj) {
			if (Array.isArray(nodeObj[key])) {
				(nodeObj[key] as unknown[]).forEach((child: unknown) =>
					this.collectVariablesFromDocument(child, variables),
				);
			} else if (typeof nodeObj[key] === "object" && nodeObj[key] !== null) {
				this.collectVariablesFromDocument(nodeObj[key], variables);
			}
		}
	}

	/**
	 * Extract all variable names from a Handlebars template string.
	 * @param template The Handlebars template string.
	 * @returns Array of variable names.
	 */
	private extractHandlebarsVariables(template: JSONContent | string): string[] {
		let stringifiedTemplate = "";
		if (typeof template === "string") {
			stringifiedTemplate = template;
		} else {
			stringifiedTemplate = this.generateHTMLFromJSONContent(template);
		}

		const ast = Handlebars.parse(stringifiedTemplate);
		const variables = new Set<string>();
		this.collectVariablesFromDocument(ast, variables);
		return Array.from(variables);
	}

	/**
	 * Get agreement by ID with download URL
	 */
	async getAgreementById(dto: { agreementId: string }, ctx: ActionCtx) {
		try {
			const result = await this.contractController.getAgreementById(
				dto.agreementId,
				ctx,
			);
			return result;
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	/**
	 * Download a signed document from Documenso
	 */
	async downloadSignedDocument(dto: { documentId: string }, _ctx: ActionCtx) {
		try {
			// Import the DocumensoSdk here to avoid circular dependencies
			const { DocumensoSdk } = await import("@/lib/documents/documenso");
			const documenso = new DocumensoSdk(env);

			const response = await documenso.downloadSignedDocument(dto.documentId);
			const pdfBuffer = await response.arrayBuffer();

			return Success({
				data: Buffer.from(pdfBuffer),
				contentType: "application/pdf",
				fileName: `documenso-${dto.documentId}.pdf`,
			});
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	/**
	 * Download and store a signed document to GCP storage
	 */
	async downloadAndStoreAgreement(
		dto: {
			agreementId: string;
			metadata?: {
				transactionId?: string;
				saleId?: string;
				customFileName?: string;
			};
		},
		_ctx: ActionCtx,
	) {
		try {
			const result = await this.contractController.downloadAndStoreAgreement(
				dto.agreementId,
				dto.metadata,
			);
			return result;
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	/**
	 * Get document details from Documenso
	 */
	async getDocumentDetails(dto: { documentId: string }, _ctx: ActionCtx) {
		try {
			// Import the DocumensoSdk here to avoid circular dependencies
			const { DocumensoSdk } = await import("@/lib/documents/documenso");
			const documenso = new DocumensoSdk(env);

			const document = await documenso.getDocumentDetails(dto.documentId);
			const downloadUrl = await documenso.getDocumentDownloadUrl(
				dto.documentId,
			);

			return Success({
				document,
				downloadUrl,
			});
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}
}

export default new DocumentsController(new StorageService());
