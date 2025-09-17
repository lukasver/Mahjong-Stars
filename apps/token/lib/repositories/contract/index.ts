import "server-only";
import { invariant } from "@epic-web/invariant";
import { SaleStatus } from "@prisma/client";
import { env } from "@/common/config/env";
import { DocumensoStatusToContractStatusMapping } from "@/common/schemas/dtos/contracts";
import { ActionCtx } from "@/common/schemas/dtos/sales";
import { Failure, Success } from "@/common/schemas/dtos/utils";
import { prisma } from "@/db";
import { agreementCache } from "@/lib/auth/cache";
import { DocumensoSdk } from "@/lib/documents/documenso";
import logger from "@/services/logger.server";
import { StorageService } from "../documents/storage";

class ContractController {
	private documenso: DocumensoSdk;
	private s3: StorageService;

	constructor(readonly storage: StorageService) {
		this.documenso = new DocumensoSdk(env);
		this.s3 = storage;
	}

	async getContract(_dto: unknown, ctx: ActionCtx) {
		const { userId } = ctx;

		try {
			const sale = await prisma.sale.findFirst({
				where: { status: SaleStatus.OPEN },
				select: {
					id: true,
				},
			});
			invariant(sale, "Sale not found or not open");

			const existingContract = await prisma.contractStatus.findFirst({
				where: { userId: userId as string, saleId: sale.id },
			});

			if (existingContract) {
				return Success({ contractStatus: existingContract });
			} else {
				return Success(null);
			}
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	async createContractStatus(dto: { contractId: string }, ctx: ActionCtx) {
		const { userId } = ctx;
		const { contractId } = dto;
		invariant(userId, "Missing userId");
		try {
			const sale = await prisma.sale.findFirst({
				where: { status: SaleStatus.OPEN },
				select: {
					id: true,
				},
			});

			invariant(sale, "Sale not found or not open");
			const { id: saleId } = sale;

			const newContract = await prisma.contractStatus.create({
				data: {
					userId: userId,
					saleId: saleId,
					contractId: contractId,
					status: "PENDING",
				},
			});
			return Success({ contractStatus: newContract });
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	async deleteContractStatus(dto: { userId: string }, _ctx: ActionCtx) {
		const { userId } = dto;

		try {
			const existingContracts = await prisma.contractStatus.deleteMany({
				where: {
					userId,
				},
			});
			invariant(existingContracts.count > 0, "Contracts not found");
			return Success({ message: "Contracts deleted" });
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	async confirmSignature(dto: { id: string }, ctx: ActionCtx) {
		const recipient = await prisma.documentRecipient.findUniqueOrThrow({
			where: {
				user: {
					id: ctx.userId,
				},
				id: dto.id,
			},
		});

		let status = recipient.status;

		if (
			(status === "SENT_FOR_SIGNATURE" ||
				status === "WAITING_FOR_COUNTERPARTY" ||
				status === "CREATED") &&
			recipient.externalId
		) {
			// Check status on provider in case webhook failed
			const document = await this.documenso.documents
				.get(
					{
						documentId: recipient.externalId,
					},
					{
						// To avoid this to be cached
						cache: "no-store",
						next: {
							revalidate: 0,
						},
					},
				)
				.catch((e) => {
					logger(e);
					return null;
				});

			if (document) {
				let mapped = DocumensoStatusToContractStatusMapping[document.status];
				const signer = document.recipients.find((r) => r.role === "SIGNER");

				if (signer?.signingStatus === "SIGNED") {
					mapped = "SIGNED";
				}
				if (mapped !== status) {
					await prisma.documentRecipient.update({
						where: { id: recipient.id },
						data: { status: mapped },
					});
				}
				if (mapped) {
					status = mapped;
				}
			}
		}

		return Success({ recipient: { ...recipient, status } });
	}

	async getAgreementById(id: string, _ctx: ActionCtx) {
		try {
			const agreement = await prisma.documentRecipient.findUnique({
				where: { id },
				select: {
					id: true,
					externalId: true,
					signatureUrl: true,
					status: true,
					SaleTransactions: {
						select: {
							id: true,
							saleId: true,
						},
					},
					storageKey: true,
				},
			});

			if (!agreement) {
				return Failure("Agreement not found");
			}

			let downloadUrl: string | null = null;
			if (agreement.status === "SIGNED" && agreement.externalId) {
				const saleId = agreement.SaleTransactions?.saleId;
				const txId = agreement.SaleTransactions?.id;

				downloadUrl =
					(await agreementCache.getOrSet(
						agreement.externalId!.toString(),
						async () => {
							// If document exists in GCP storage, return the signed URL
							if (agreement.storageKey) {
								const signedUrl = await this.s3.generateReadSignedUrl(
									"private",
									agreement.storageKey,
									{ expires: Date.now() + 24 * 60 * 60 * 1000 }, // 24 hours
								);
								return signedUrl.url;
							}

							// Else, download and store the document to GCP bucket
							const result = await this.documenso.downloadAndStoreDocument(
								agreement.id,
								agreement.externalId!.toString(),
								`sale/${saleId}/tx/${txId}/saft.pdf`,
							);

							if (!result.success) {
								throw new Error(
									`Failed to download and store document: ${result.error}`,
								);
							}

							return result.fileUrl;
						},
					)) || null;
			}

			return Success({ agreement: { ...agreement, downloadUrl } });
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	/**
	 * Download and store a signed document to GCP storage
	 * @param agreementId - The agreement ID
	 * @param metadata - Optional metadata for the file
	 * @returns Promise with storage result
	 */
	async downloadAndStoreAgreement(
		agreementId: string,
		_metadata?: {
			transactionId?: string;
			userId?: string;
			saleId?: string;
			customFileName?: string;
		},
	) {
		try {
			const agreement = await prisma.documentRecipient.findUnique({
				where: { id: agreementId },
				select: {
					id: true,
					externalId: true,
					status: true,
					user: {
						select: {
							id: true,
						},
					},
				},
			});

			if (!agreement) {
				return Failure("Agreement not found");
			}

			if (agreement.status !== "SIGNED") {
				return Failure("Agreement is not signed yet");
			}

			if (!agreement.externalId) {
				return Failure("No external document ID found");
			}

			// Download and store to GCP
			const result = await this.documenso.downloadAndStoreDocument(
				agreement.id,
				agreement.externalId!.toString(),
				`documenso-${agreement.externalId}-${agreement.id}.pdf`,
			);

			if (result.success) {
				// Optionally store the file URL in your database
				await prisma.documentRecipient.update({
					where: { id: agreementId },
					data: {
						// You might want to add a field to store the GCP file URL
						// gcpFileUrl: result.fileUrl,
					},
				});

				return Success({
					success: true,
					fileUrl: result.fileUrl,
					agreementId,
				});
			} else {
				return Failure(result.error || "Failed to store document");
			}
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	/**
	 * Get a signed document from GCP storage
	 * @param fileName - The file name in GCP storage
	 * @returns Promise with the signed URL
	 */
	async getStoredDocumentUrl(fileName: string) {
		try {
			const fileUrl = await this.s3.generateReadSignedUrl(
				"private",
				fileName,
				{ expires: Date.now() + 24 * 60 * 60 * 1000 }, // 24 hours
			);

			if (!fileUrl) {
				return Failure("File not found in storage");
			}

			return Success({ fileUrl });
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}
}

export default new ContractController(new StorageService());
