import "server-only";
import { InvariantError, invariant } from "@epic-web/invariant";
import { formatDate } from "@mjs/utils/client";
import {
	DocumentSignatureStatus,
	FOP,
	Prisma,
	PrismaClient,
	Sale,
	SaleStatus,
	SaleTransactions,
	TransactionStatus,
} from "@prisma/client";
import { Geo, waitUntil } from "@vercel/functions";
import { deepmerge } from "deepmerge-ts";
import Handlebars from "handlebars";
import { DateTime } from "luxon";
import { z } from "zod";
import { FIAT_CURRENCIES } from "@/common/config/constants";
import { publicUrl } from "@/common/config/env";
import { metadata as siteMetadata } from "@/common/config/site";
import { ActionCtx } from "@/common/schemas/dtos/sales";
import {
	CreateTransactionDto,
	GetTransactionDto,
} from "@/common/schemas/dtos/transactions";
import {
	decimalsToString,
	Failure,
	Success,
} from "@/common/schemas/dtos/utils";
import {
	Address,
	DocumentSignatureStatusSchema,
	KycStatusSchema,
	KycTierSchema,
	KycTierType,
	Profile,
	SaftContract,
	SignableDocumentRoleSchema,
	SignableDocumentRoleType,
	User,
} from "@/common/schemas/generated";
import {
	AdminTransactionsWithRelations,
	TransactionByIdWithRelations,
	TransactionWithRelations,
} from "@/common/types/transactions";
import { prisma } from "@/db";
import { InstaxchangeService } from "@/lib/services/instaxchange";
import { PaymentMethod } from "@/lib/services/instaxchange/types";
import logger from "@/lib/services/logger.server";
import documentsController from "../documents";
import rates from "../feeds/rates";
import notificatorService, { Notificator } from "../notifications";
import { emailEventHelpers } from "../notifications/email-events";
import { ConfirmTransactionDto, RejectTransactionDto } from "./dtos";
import { PaymentsService } from "./payments";
import { TransactionValidator } from "./validator";

export class TransactionsController {
	private documents;
	private readonly notificator: Notificator;
	private readonly db: PrismaClient;

	constructor(
		_db: PrismaClient,
		_notificator: Notificator,
		private readonly payments: PaymentsService,
	) {
		this.documents = documentsController;
		this.notificator = _notificator;
		this.db = _db;
	}

	/**
	 * Get all transactions (admin only).
	 */
	async getAllTransactions(
		dto: { saleId?: string; userId?: string },
		ctx: ActionCtx,
	) {
		try {
			invariant(ctx.isAdmin, "Forbidden");
			const whereClause: Record<string, string> = {};

			if (dto.saleId) {
				whereClause.saleId = dto.saleId;
			}

			if (dto.userId) {
				whereClause.userId = dto.userId;
			}

			const transactions: AdminTransactionsWithRelations[] =
				await this.db.saleTransactions.findMany({
					...(Object.keys(whereClause).length > 0 && { where: whereClause }),
					include: {
						sale: true,
						user: {
							select: {
								email: true,
								profile: {
									select: {
										firstName: true,
										lastName: true,
									},
								},
								kycVerification: {
									select: {
										id: true,
										status: true,
										documents: {
											select: {
												id: true,
												url: true,
												fileName: true,
												name: true,
											},
										},
									},
								},
							},
						},
						approver: true,
						blockchain: true,
						tokenDistributions: true,
					},
					orderBy: { createdAt: "desc" },
				});
			return Success({
				transactions: transactions.map((t) => decimalsToString(t)),
				quantity: transactions.length,
			});
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	/**
	 * Update a transaction status (admin only).
	 * @param dto - Transaction update data
	 * @param ctx - Action context
	 */
	async adminUpdateTransaction(
		dto: {
			id: string;
			requiresKYC: boolean;
			status: TransactionStatus;
			comment?: string;
		},
		ctx: ActionCtx,
	) {
		try {
			invariant(ctx.isAdmin, "Forbidden");
			invariant(dto.id, "Id missing");
			const { id, requiresKYC } = dto;
			const tx = await this.db.saleTransactions.update({
				where: { id },
				data: {
					status: dto.status,
					...(dto.status === TransactionStatus.PAYMENT_VERIFIED && {
						approver: {
							connect: {
								id: ctx.userId,
							},
						},
					}),
				},
				select: {
					id: true,
					quantity: true,
					amountPaid: true,
					paidCurrency: true,
					formOfPayment: true,
					receivingWallet: true,
					txHash: true,
					paymentDate: true,
					rejectionReason: true,
					blockchainId: true,
					user: {
						select: {
							id: true,
							name: true,
							email: true,
							walletAddress: true,
						},
					},
					sale: {
						select: {
							name: true,
							tokenSymbol: true,
						},
					},
				},
			});

			if (requiresKYC) {
				await this.db.user.update({
					where: { id: tx.user.id },
					data: {
						kycVerification: {
							upsert: {
								create: { status: "VERIFIED" },
								update: { status: "VERIFIED" },
							},
						},
					},
				});
			}

			if (dto.status === TransactionStatus.PAYMENT_VERIFIED) {
				await this.notificator.send({
					template: "paymentVerified",
					to: [{ email: tx.user.email }],
					subject: `Payment verified for ${tx.sale.name} | ${tx.id}`,
					props: {
						userName: tx.user.name,
						tokenName: tx.sale.name,
						tokenSymbol: tx.sale.tokenSymbol,
						purchaseAmount: tx.amountPaid || "0",
						tokenAmount: tx.quantity.toString(),
						transactionHash: tx.txHash,
						transactionTime:
							tx.paymentDate?.toISOString() || new Date().toISOString(),
						paymentMethod: tx.formOfPayment,
						walletAddress: tx.receivingWallet || tx.user.walletAddress,
						transactionId: tx.id,
						supportEmail: siteMetadata.supportEmail,
						paidCurrency: tx.paidCurrency,
					},
				});
			}
			if (dto.status === TransactionStatus.REJECTED) {
				await this.notificator.send({
					template: "transactionRejected",
					to: [{ email: tx.user.email }],
					subject: `${tx.sale.name} Transaction Rejected | ${tx.id}`,
					props: {
						userName: tx.user.name,
						tokenName: tx.sale.name,
						tokenSymbol: tx.sale.tokenSymbol,
						purchaseAmount: tx.amountPaid || "0",
						transactionHash: tx.txHash,
						transactionTime:
							tx.paymentDate?.toISOString() || new Date().toISOString(),
						paymentMethod: tx.formOfPayment,
						walletAddress: tx.receivingWallet || tx.user.walletAddress,
						transactionId: tx.id,
						rejectionReason: tx.rejectionReason || dto.comment,
						supportEmail: siteMetadata.supportEmail,
						paidCurrency: tx.paidCurrency,
					},
				});
			}

			// Send email notifications for token distribution and refunds
			if (dto.status === TransactionStatus.TOKENS_DISTRIBUTED) {
				const transactionHash = tx.txHash;
				const blockchain = await this.db.blockchain.findUnique({
					where: { id: tx.blockchainId || undefined },
					select: { explorerUrl: true },
				});

				emailEventHelpers
					.tokensDistributed({
						userName: tx.user.name,
						userEmail: tx.user.email,
						tokenName: tx.sale.name,
						tokenSymbol: tx.sale.tokenSymbol,
						tokenAmount: tx.quantity.toString(),
						walletAddress: tx.receivingWallet || tx.user.walletAddress,
						transactionHash: transactionHash || undefined,
						transactionUrl:
							transactionHash && blockchain?.explorerUrl
								? `${blockchain.explorerUrl}/tx/${transactionHash}`
								: undefined,
						distributionDate: new Date().toISOString(),
						dashboardUrl: `${publicUrl}/dashboard/transactions/${tx.id}`,
						supportEmail: siteMetadata.supportEmail,
					})
					.catch((e) => {
						logger(
							"Failed to send tokens distributed email:",
							e instanceof Error ? e.message : undefined,
						);
					});
			}

			if (dto.status === TransactionStatus.REFUNDED) {
				emailEventHelpers
					.refundProcessed({
						userName: tx.user.name,
						userEmail: tx.user.email,
						refundAmount: tx.amountPaid || "0",
						refundCurrency: tx.paidCurrency,
						transactionId: tx.id,
						refundMethod: "Original Payment Method",
						refundReason: tx.rejectionReason || dto.comment,
						dashboardUrl: `${publicUrl}/dashboard/transactions/${tx.id}`,
						supportEmail: siteMetadata.supportEmail,
						tokenName: siteMetadata.businessName,
					})
					.catch((e) => {
						logger(
							"Failed to send refund processed email:",
							e instanceof Error ? e.message : undefined,
						);
					});
			}

			return Success({ transaction: decimalsToString(tx) });
		} catch (error) {
			logger(error);
			return Failure(error);
		}
	}

	/**
	 * Get all transactions for a user (optionally filtered by sale or symbol).
	 */
	async getUserTransactions(
		dto: Omit<GetTransactionDto, "userId">,
		ctx: ActionCtx,
	) {
		try {
			const { formOfPayment, tokenSymbol: symbol, saleId: sale } = dto;
			let userId = ctx.userId;
			const address = ctx.address;

			if (!userId) {
				const user = await this.db.user.findUniqueOrThrow({
					where: { walletAddress: address },
					select: { id: true },
				});
				userId = user.id;
			}
			let saleId: string | undefined = sale;
			const andQuery: { saleId?: string; tokenSymbol?: string }[] = [];
			if (sale === "current") {
				saleId = (
					await this.db.sale.findFirst({ where: { status: SaleStatus.OPEN } })
				)?.id;
				andQuery.push({ saleId });
			}
			if (symbol) andQuery.push({ tokenSymbol: symbol });
			const transactions: TransactionWithRelations[] =
				await this.db.saleTransactions.findMany({
					where: {
						OR: [
							{ userId, ...(formOfPayment && { formOfPayment }) },
							{
								receivingWallet: userId,
								...(formOfPayment && { formOfPayment }),
							},
						],
						...(andQuery.length && { AND: andQuery }),
					},
					include: {
						sale: true,
						approver: true,
						blockchain: true,
						tokenDistributions: true,
					},
					orderBy: { createdAt: "desc" },
				});

			return Success({
				transactions: transactions.map((t) =>
					decimalsToString({
						...t,
						explorerUrl: !t.txHash
							? null
							: `${t?.blockchain?.explorerUrl}/tx/${t.txHash}`,
					}),
				),
			});
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	async getTransactionById(dto: { id: string }, ctx: ActionCtx) {
		try {
			const transaction = await this.db.saleTransactions.findUnique({
				where: { id: String(dto.id) },
				include: {
					sale: {
						select: {
							id: true,
							name: true,
							requiresKYC: true,
							saftCheckbox: true,
							currency: true,
							tokenPricePerUnit: true,
							tokenSymbol: true,
							toWalletsAddress: true,
							blockchain: {
								select: {
									explorerUrl: true,
								},
							},
							saftContract: {
								select: {
									id: true,
								},
							},
						},
					},
					user: {
						select: {
							walletAddress: true,
							email: true,
							profile: {
								select: {
									firstName: true,
									lastName: true,
								},
							},
							kycVerification: {
								select: {
									id: true,
									status: true,
									documents: {
										select: {
											url: true,
											fileName: true,
											id: true,
											name: true,
										},
									},
								},
							},
						},
					},
					blockchain: {
						select: {
							explorerUrl: true,
							chainId: true,
						},
					},
				},
			});

			invariant(transaction, "Transaction not found");

			const { blockchain, ...tx } = transaction;

			let kycTier: KycTierType | "BLOCKED" | null = null;
			// Derive if the TX requires saft based on:
			if (tx.sale.requiresKYC) {
				// For payments in CC the KYC is done by the bank, so we don't need to check KYC
				if (tx.formOfPayment === FOP.CARD) {
					kycTier = null;
				}

				if (
					tx.formOfPayment === FOP.CRYPTO ||
					tx.formOfPayment === FOP.TRANSFER
				) {
					const result = await this.checkMaxAllowanceWithKYC(
						{ amount: tx.totalAmount, currency: tx.totalAmountCurrency },
						ctx,
					);

					kycTier =
						result.result === "FAILURE"
							? // Default tier to apply if failed to check KYC
							KycTierSchema.enum.ENHANCED
							: result.result;
				}
			}

			return Success({
				transaction: decimalsToString(tx) as TransactionByIdWithRelations,
				requiresKYC: kycTier,
				requiresSAFT: tx.sale.saftCheckbox,
				explorerUrl: tx.txHash
					? `${blockchain?.explorerUrl}/tx/${transaction.txHash}`
					: null,
			});
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	/**
	 * Create a new transaction.
	 */
	async createTransaction(dto: CreateTransactionDto, ctx: ActionCtx) {
		try {
			const {
				tokenSymbol,
				quantity,
				formOfPayment,
				receivingWallet,
				saleId,
				comment,
				totalAmount,
				paidCurrency,
				fees,
			} = dto;

			const userId = ctx.userId;
			invariant(saleId, "Sale id missing");
			invariant(userId, "User id missing");

			// Use the validator to validate transaction creation
			const validationResult =
				await TransactionValidator.validateTransactionCreation({
					userId,
					saleId,
					tokenSymbol,
					quantity: quantity.toNumber(),
					formOfPayment,
					totalAmount,
					paidCurrency,
					receivingWallet: receivingWallet || undefined,
					comment: comment || undefined,
				});

			const { sale } = validationResult;
			const price = new Prisma.Decimal(totalAmount);
			const [_updtSale, transaction] = await this.db.$transaction([
				this.db.sale.update({
					where: { id: saleId },
					data: { availableTokenQuantity: { decrement: Number(quantity) } },
					select: {
						availableTokenQuantity: true,
						id: true,
					},
				}),
				this.db.saleTransactions.create({
					data: {
						tokenSymbol,
						quantity: new Prisma.Decimal(quantity),
						formOfPayment,
						receivingWallet,
						comment,
						status: TransactionStatus.PENDING,
						totalAmountCurrency: paidCurrency,
						paidCurrency,
						saleId,
						userId,
						price: price.div(new Prisma.Decimal(quantity)),
						totalAmount: price,
					},
					select: {
						id: true,
						tokenSymbol: true,
						quantity: true,
						formOfPayment: true,
						amountPaid: true,
						paidCurrency: true,
						receivingWallet: true,
						comment: true,
						status: true,
						price: true,
						totalAmount: true,
						createdAt: true,
						updatedAt: true,
						user: {
							select: {
								email: true,
								walletAddress: true,
								id: true,
							},
						},
						sale: {
							select: {
								id: true,
								name: true,
								tokenSymbol: true,
							},
						},
					},
				}),
			]);

			if (transaction && fees && fees.length > 0) {
				// Create fees in the background
				waitUntil(
					this.db.transactionFee
						.createMany({
							data: fees.map(({ metadata, ...f }) => ({
								...f,
								transactionId: transaction.id,
								...(metadata && {
									metadata: {
										toJSON() {
											return metadata;
										},
									},
								}),
							})),
						})
						.catch((e) => {
							logger(e);
						}),
				);
			}

			return Success({
				transaction: decimalsToString(transaction),
				saft: sale.saftCheckbox,
				kyc: sale.requiresKYC,
				paymentMethod: formOfPayment,
			});
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	/**
	 * Delete own transaction by id.
	 */
	async deleteOwnTransaction(dto: { id: string }, ctx: ActionCtx) {
		try {
			invariant(dto.id, "Transaction id missing");
			invariant(ctx.userId, "User id missing");
			const tx = await this.db.saleTransactions.findUnique({
				where: { id: String(dto.id), userId: ctx.userId },
				select: {
					id: true,
					saleId: true,
					quantity: true,
					userId: true,
					status: true,
				},
			});
			invariant(tx, "Transaction not found");

			if (
				![
					TransactionStatus.AWAITING_PAYMENT,
					TransactionStatus.PENDING,
				].includes(tx.status)
			) {
				throw new Error(
					`Transaction cannot be deleted due to status: ${tx.status}`,
				);
			}
			await this.cancelTransactionAndRestoreUnits(tx, "Cancelled by user");
			return Success({ id: tx.id });
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	/**
	 * Update transaction to AWAITING_PAYMENT status with formOfPayment = CARD
	 * Validates that user doesn't already have another reserved transaction
	 */
	async updateTransactionToAwaitingPayment(
		dto: { id: string },
		ctx: ActionCtx,
	) {
		try {
			invariant(dto.id, "Transaction id missing");
			invariant(ctx.userId, "User id missing");

			// Check if user already has a reserved transaction (AWAITING_PAYMENT + CARD)
			const existingReservedTx = await this.db.saleTransactions.findFirst({
				where: {
					userId: ctx.userId,
					status: TransactionStatus.AWAITING_PAYMENT,
					formOfPayment: FOP.CARD,
					id: { not: dto.id }, // Exclude the current transaction
				},
				select: {
					id: true,
					totalAmount: true,
					paidCurrency: true,
				},
			});

			if (existingReservedTx) {
				return Failure({
					code: "RESERVED_TRANSACTION_EXISTS",
					message: "You already have a reserved transaction for card payment",
					existingTransactionId: existingReservedTx.id,
				});
			}

			// Verify transaction exists and belongs to user
			const tx = await this.db.saleTransactions.findUnique({
				where: { id: String(dto.id), userId: ctx.userId },
				select: {
					id: true,
					status: true,
					formOfPayment: true,
				},
			});

			invariant(tx, "Transaction not found");

			// Update transaction to AWAITING_PAYMENT and set formOfPayment to CARD
			const updatedTx = await this.db.saleTransactions.update({
				where: { id: tx.id },
				data: {
					status: TransactionStatus.AWAITING_PAYMENT,
					formOfPayment: FOP.CARD,
				},
				select: {
					id: true,
					status: true,
					formOfPayment: true,
				},
			});

			return Success({ transaction: updatedTx });
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	public crons = {
		cleanUp: async () => {
			console.debug(
				`Running transactions cleanup cronjob: ${DateTime.now().toLocaleString(DateTime.DATETIME_FULL)}`,
			);
			console.time("transactions-cleanup");
			const sixHoursAgo = DateTime.local().minus({ hours: 6 }).toJSDate();

			try {
				const txs = await this.db.saleTransactions.findMany({
					where: {
						AND: [
							{
								status: {
									in: [
										TransactionStatus.PENDING,
										TransactionStatus.AWAITING_PAYMENT,
									],
								},
							},
							{
								sale: {
									status: {
										in: [
											SaleStatus.OPEN,
											SaleStatus.FINISHED,
											SaleStatus.CLOSED,
										],
									},
								},
							},
							{
								createdAt: { lte: sixHoursAgo },
							},
							// Exclude CARD+AWAITING_PAYMENT transactions from cleanup
							{
								OR: [
									{ status: { not: TransactionStatus.AWAITING_PAYMENT } },
									{ formOfPayment: { not: FOP.CARD } },
								],
							},
						],
					},
					select: {
						id: true,
						quantity: true,
						user: {
							select: {
								email: true,
								emailVerified: true,
								profile: {
									select: {
										firstName: true,
										lastName: true,
									},
								},
							},
						},
						sale: {
							select: {
								id: true,
								name: true,
								tokenSymbol: true,
							},
						},
						saleId: true,
					},
				});

				await this.db.$transaction(async (prisma) => {
					await this.db.saleTransactions.updateMany({
						where: {
							id: { in: txs.map((tx) => tx.id) },
						},
						data: {
							status: TransactionStatus.CANCELLED,
							comment:
								"Transaction cancelled for not being confirmed after time limit",
						},
					});

					let groupedTxsBySaleId: Record<
						string,
						Array<(typeof txs)[number]>
					> = {};

					// group transactions by saleId to prepare for next step
					groupedTxsBySaleId = txs.reduce((acc, tx) => {
						if (!acc[tx.saleId]) {
							acc[tx.saleId] = [];
						}
						acc[tx.saleId]?.push(tx);
						return acc;
					}, groupedTxsBySaleId);

					// Restore sum of all units to each sale affected
					return await Promise.all(
						Object.entries(groupedTxsBySaleId).map(([saleId, groupedTxs]) => {
							const quantityToReturn = groupedTxs.reduce((acc, tx) => {
								return acc.add(tx.quantity);
							}, new Prisma.Decimal(0));
							return this.db.sale.update({
								where: { id: saleId },
								data: {
									availableTokenQuantity: {
										increment: quantityToReturn.toNumber(),
									},
								},
							});
						}),
					);
				});

				// Notify user by email
				await Promise.allSettled(
					txs
						.filter((tx) => tx.user.emailVerified)
						.map((tx) =>
							this.notificator.send({
								to: {
									email: tx.user.email,
									name: tx.user.profile?.firstName
										? `${tx.user.profile.firstName} ${tx.user.profile.lastName || ""}`.trim()
										: undefined,
								},
								subject: "Transaction cancelled",
								template: "transactionCancelled",
								props: {
									userName: tx.user.profile?.firstName
										? `${tx.user.profile.firstName} ${tx.user.profile.lastName || ""}`.trim()
										: tx.user.email,
									saleName: tx.sale.name,
									transactionId: tx.id,
									quantity: tx.quantity.toString(),
									tokenSymbol: tx.sale.tokenSymbol,
									reason:
										"Transaction cancelled for not being confirmed after time limit",
									supportEmail: siteMetadata.supportEmail,
								},
							}),
						),
				);

				return Success({});
			} catch (e) {
				logger(e);
				return Failure(e);
			} finally {
				console.timeEnd("transactions-cleanup");
			}
		},
	};

	/**
	 * Get user transactions for a specific sale.
	 */
	async userTransactionsForSale(
		dto: { saleId: string; status?: TransactionStatus[] },
		ctx: ActionCtx,
	) {
		try {
			const { saleId, status: _status } = dto;
			invariant(saleId, "Sale not found");
			const transactions = await this.db.saleTransactions.findMany({
				where: {
					AND: [
						{ saleId: String(saleId) },
						{ user: { walletAddress: ctx.address } },
						{ status: { in: _status } },
					],
				},
			});
			const transaction = transactions[0];
			let contract = { isSign: false, urlSign: null };
			if (transaction?.agreementId) {
				contract = { isSign: false, urlSign: null };
				// contract = await urlContract(transaction.agreementId);
			}
			return Success({
				totalCount: transactions?.length,
				transactions,
				contract,
			});
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	async generateContractForTransaction(
		dto: {
			transactionId: string;
			contractId: string;
			variables?: Record<string, string | Record<string, string>>;
		},
		ctx: ActionCtx,
	) {
		// Here we need to get the contract, update the variables with new information and call the documenso service to generate
		// contract. generate an ID in and store it in our DB, respond FASt. cannot wait for documenso generateion will need to add webhook.
		try {
			//TODO! add own user check?
			// 1) Fetch contract and recompute variables
			const result = await this.getSaleSaftForTransaction(
				{ txId: dto.transactionId, variables: dto.variables },
				ctx,
			);

			// const temp = result.data;
			// return temp;
			invariant(result.success, "Failed to get sale saft for transaction");
			const { content } = result.data;
			const user = await this.db.user.findUnique({
				where: { walletAddress: ctx.address },
				select: {
					email: true,
					id: true,
					profile: { select: { firstName: true, lastName: true } },
				},
			});
			invariant(user, "User not found");
			const fullname =
				user?.profile?.firstName || user.profile?.lastName
					? `${user.profile?.firstName} ${user.profile?.lastName}`
					: "";

			// 2) Generate contract reference in our own DB and call documenso service to generate the HTML
			const recipient = await this.db.documentRecipient.create({
				data: {
					email: user.email,
					fullname,
					role: SignableDocumentRoleSchema.enum.SIGNER,
					address: ctx.address,
					saftContractId: dto.contractId,
					SaleTransactions: {
						connect: {
							id: dto.transactionId,
						},
					},
				},
				select: {
					id: true,
				},
			});

			const res = await this.db.saftContract.findUnique({
				where: { id: dto.contractId },
				select: { approver: { select: { email: true, fullname: true } } },
			});

			// Purchase recipient
			const recipients: {
				email: string;
				name: string;
				role: SignableDocumentRoleType;
			}[] = [{ email: user.email, name: fullname, role: "SIGNER" }];

			// Add the approver as recipient if configured
			if (res && res.approver) {
				recipients.push({
					email: res.approver.email,
					name: res.approver.fullname || "Approver",
					role: "APPROVER",
				});
			}

			// This needs to be here for this to work in Vercel Functions
			waitUntil(
				this.documents
					.generatePDF({
						content,
						title: `Token Agreement | ${dto.transactionId} | ${user.email}`,
						recipients,
						reference: recipient.id,
					})
					.catch(async (e) => {
						await this.db.documentRecipient.update({
							where: { id: recipient.id },
							data: {
								status: DocumentSignatureStatusSchema.enum.ERROR,
							},
						});
						logger(e);
					}),
			);

			return Success({
				id: recipient.id,
			});
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	async getSaleSaftForTransaction(
		dto: {
			txId: string;
			variables?: Record<string, string | Record<string, string>>;
		},
		_ctx: ActionCtx,
	) {
		// We need to retrieve the saft content for the sale.
		// We need to replace default variables with the ones from the transaction.
		// We need ot send it to the front end for review with puplated vars
		try {
			const transaction = await this.db.saleTransactions.findUnique({
				where: { id: String(dto.txId) },
				include: {
					user: {
						include: {
							profile: {
								include: {
									address: true,
								},
							},
						},
					},
					sale: {
						include: {
							saftContract: {
								select: {
									id: true,
									content: true,
									variables: true,
								},
							},
						},
					},
				},
			});

			invariant(transaction, "Transaction not found");
			const saftContract = transaction?.sale?.saftContract;
			invariant(saftContract, "SAFT template not found in transaction");

			// These are the variables from the information we have of the tx, sale, user, etc...
			const contractVariables = this.parseTransactionVariablesToContract({
				tx: transaction,
				sale: transaction.sale,
				contract: saftContract.content,
				user: transaction.user,
				profile: transaction.user?.profile,
				address: transaction.user?.profile?.address,
				inputVariables: dto.variables,
			});

			// variables is an array of strings, we should compute the missing variables, wich are the ones in the array that has no value in the contractVariables object.
			const missingVariables = this.computeMissingVariables(
				saftContract.variables,
				contractVariables.variables,
			);

			return Success({
				id: saftContract.id,
				content: contractVariables.contract,
				missingVariables,
			});
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	async getSaftForTransactionDetails(
		dto: { recipientId: string },
		ctx: ActionCtx,
	) {
		try {
			const recipient = await this.db.documentRecipient.findUnique({
				where: { id: dto.recipientId, address: ctx.address },
				select: {
					id: true,
					saftContractId: true,
					externalId: true,
					status: true,
					signatureUrl: true,
					email: true,
					fullname: true,
				},
			});
			invariant(recipient, "Recipient not found");
			return Success({
				recipient,
			});
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	/**
	 * Reject or cancel a transaction and restore units to the sale
	 * Valid transaction statuses: PENDING, AWAITING_PAYMENT, PAYMENT_SUBMITTED
	 * Sends email notification to the user
	 * @param dto - Transaction rejection/cancellation data
	 * @param ctx - Action context
	 * @returns Success or Failure result
	 */
	async rejectTransaction(dto: RejectTransactionDto, ctx: ActionCtx) {
		try {
			invariant(dto.id, "Transaction ID is required");

			// Determine target status (default to REJECTED)
			const targetStatus =
				(dto.status === "CANCELLED"
					? TransactionStatus.CANCELLED
					: TransactionStatus.REJECTED) as TransactionStatus;

			// Fetch transaction with necessary relations
			const tx = await this.db.saleTransactions.findUniqueOrThrow({
				where: { id: dto.id },
				include: {
					sale: {
						select: {
							id: true,
							name: true,
							tokenSymbol: true,
							availableTokenQuantity: true,
						},
					},
					user: {
						select: {
							id: true,
							email: true,
							emailVerified: true,
							walletAddress: true,
							profile: {
								select: {
									firstName: true,
									lastName: true,
								},
							},
						},
					},
				},
			});

			// Validate transaction status - only allow rejection/cancellation for specific statuses
			const allowedStatuses = [
				TransactionStatus.PENDING,
				TransactionStatus.AWAITING_PAYMENT,
				TransactionStatus.PAYMENT_SUBMITTED,
			];

			if (!allowedStatuses.includes(tx.status)) {
				throw new Error(
					`Transaction cannot be ${targetStatus === TransactionStatus.CANCELLED ? "cancelled" : "rejected"}. Current status: ${tx.status}. Allowed statuses: ${allowedStatuses.join(", ")}`,
				);
			}

			// Prepare update data based on target status
			const defaultReason =
				targetStatus === TransactionStatus.CANCELLED
					? "Transaction cancelled"
					: "Transaction rejected";

			const updateData: Prisma.SaleTransactionsUpdateInput = {
				status: targetStatus,
				comment: dto.reason || defaultReason,
				...(dto.metadata && {
					metadata: {
						toJSON() {
							return dto.metadata;
						},
					},
				}),
			};

			// Only set rejectionReason for REJECTED status
			if (targetStatus === TransactionStatus.REJECTED) {
				updateData.rejectionReason = dto.reason || defaultReason;
			}

			// Update transaction and restore units to sale
			const [updatedTx] = await this.db.$transaction([
				// Restore units to sale
				this.db.sale.update({
					where: { id: tx.saleId },
					data: {
						availableTokenQuantity: {
							increment: tx.quantity.toNumber(),
						},
					},
				}),
				// Update transaction status
				this.db.saleTransactions.update({
					where: { id: dto.id },
					data: updateData,
					include: {
						sale: {
							select: {
								name: true,
								tokenSymbol: true,
							},
						},
					},
				}),
			]);

			// Send email notification to user
			if (tx.user.emailVerified) {
				const userName =
					tx.user.profile?.firstName || tx.user.profile?.lastName
						? `${tx.user.profile.firstName || ""} ${tx.user.profile.lastName || ""}`.trim()
						: tx.user.email;

				const isCancelled = targetStatus === TransactionStatus.CANCELLED;

				await this.notificator.send({
					template: isCancelled ? "transactionCancelled" : "transactionRejected",
					to: {
						email: tx.user.email,
						name: userName,
					},
					subject: `${tx.sale.name} Transaction ${isCancelled ? "Cancelled" : "Rejected"} | ${tx.id}`,
					props: isCancelled
						? {
							userName,
							saleName: tx.sale.name,
							transactionId: tx.id,
							quantity: tx.quantity.toString(),
							tokenSymbol: tx.sale.tokenSymbol,
							reason: dto.reason || defaultReason,
							supportEmail: siteMetadata.supportEmail,
						}
						: {
							userName,
							tokenName: tx.sale.name,
							tokenSymbol: tx.sale.tokenSymbol,
							purchaseAmount:
								tx.amountPaid?.toString() || tx.totalAmount.toString(),
							transactionHash: tx.txHash || tx.id,
							transactionTime:
								tx.paymentDate?.toISOString() || tx.createdAt.toISOString(),
							paymentMethod: tx.formOfPayment,
							walletAddress: tx.receivingWallet || tx.user.walletAddress,
							transactionId: tx.id,
							rejectionReason: dto.reason || defaultReason,
							supportEmail: siteMetadata.supportEmail,
							paidCurrency: tx.paidCurrency || tx.totalAmountCurrency || "",
						},
				});
			}

			return Success({ transaction: decimalsToString(updatedTx) });
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	async confirmTransaction(
		{ id, type, payload }: ConfirmTransactionDto,
		ctx: ActionCtx,
	) {
		try {
			// Only the user who created the transaction can confirm it
			const [tx, admins] = await Promise.all([
				this.db.saleTransactions.findUniqueOrThrow({
					where: { id, userId: ctx.userId },
					include: {
						sale: {
							select: {
								availableTokenQuantity: true,
								name: true,
								tokenSymbol: true,
								currency: true,
								tokenPricePerUnit: true,
							},
						},
						blockchain: {
							select: {
								explorerUrl: true,
								chainId: true,
							},
						},
						user: {
							select: {
								email: true,
								emailVerified: true,
								profile: {
									select: {
										firstName: true,
										lastName: true,
									},
								},
							},
						},
					},
				}),
				this.db.user.findMany({
					where: {
						userRole: {
							some: {
								role: { name: { in: ["ADMIN", "SUPER_ADMIN"] } },
							},
						},
						emailVerified: true,
					},
					select: {
						id: true,
						email: true,
					},
				}),
			]);

			const shouldFinishSale = new Prisma.Decimal(
				tx.sale.availableTokenQuantity,
			).equals(tx.quantity);

			if (payload?.metadata) {
				//Debug
				logger(`metadata ${JSON.stringify(payload.metadata)}`);
			}

			const {
				chainId,
				paymentEvidenceId,
				paidCurrency,
				formOfPayment,
				metadata,
				...rest
			} = payload || {};

			const isCryptoWithoutConfirmation =
				formOfPayment === "CRYPTO" && (!chainId || !rest.txHash);

			if (isCryptoWithoutConfirmation) {
				throw new Error(
					"Crypto transaction without confirmation is not allowed, please wait for the transaction to be confirmed or contact support",
				);
			}

			const [updatedTx] = await this.db.$transaction([
				this.db.saleTransactions.update({
					where: { id },
					data: {
						status: TransactionStatus.PAYMENT_SUBMITTED,
						...(chainId && {
							blockchain: {
								connect: {
									chainId,
								},
							},
						}),
						...(metadata && {
							metadata: {
								toJSON() {
									return metadata;
								},
							},
						}),
						amountPaid: tx.totalAmount.toString(),
						paymentDate: new Date(),
						...(paymentEvidenceId && {
							paymentEvidence: {
								connect: {
									id: paymentEvidenceId,
								},
							},
						}),
						// ...(metadata && { metadata }),
						...(formOfPayment && { formOfPayment }),
						...(paidCurrency && {
							amountPaidCurrency: { connect: { symbol: paidCurrency } },
						}),
						...rest,
					},
					include: {
						blockchain: {
							select: {
								explorerUrl: true,
							},
						},
					},
				}),
				this.db.sale.update({
					where: { id: tx.saleId },
					data: {
						...(shouldFinishSale && { status: SaleStatus.FINISHED }),
						availableTokenQuantity: {
							decrement: tx.quantity.toNumber(),
						},
					},
				}),
			]);

			function getEmailStatus(
				tx: SaleTransactions,
			): "RECONCILIATION_PENDING" | "AWAITING_PAYMENT" | "CONFIRMED" {
				if (tx.formOfPayment === FOP.TRANSFER) {
					return "RECONCILIATION_PENDING";
				}
				if (tx.formOfPayment === FOP.CARD) {
					return "CONFIRMED";
				}
				if (
					tx.formOfPayment === FOP.CRYPTO &&
					((tx.metadata as Record<string, unknown>)?.provider === "manual" ||
						(tx.metadata as Record<string, unknown>)?.paymentMethod ===
						"manual")
				) {
					return "RECONCILIATION_PENDING";
				}
				if (tx.status === TransactionStatus.COMPLETED) {
					return "CONFIRMED";
				}

				return "RECONCILIATION_PENDING";
			}

			const processingTime = formatDate(DateTime.now(), {
				format: DateTime.DATETIME_MED,
			});
			await Promise.allSettled([
				// Notify admin
				this.notificator.send({
					template: "adminTransactionConfirmed",
					to: admins.map((admin) => ({
						email: admin.email,
					})),
					subject: `${tx.sale.name} Transaction Confirmed | ${tx.id}`,
					props: {
						adminName: "Admin",
						userName:
							tx.user.profile?.firstName || tx.user.profile?.lastName || "User",
						userEmail: tx.user.email,
						tokenName: tx.sale.name,
						tokenSymbol: tx.sale.tokenSymbol,
						purchaseAmount: updatedTx.totalAmount.toString(),
						tokenAmount: updatedTx.quantity.toString(),
						transactionId: updatedTx.id,
						paymentMethod: updatedTx.formOfPayment,
						paidCurrency: updatedTx.paidCurrency,
						walletAddress: updatedTx.receivingWallet || "",
						status: getEmailStatus(updatedTx),
						dashboardUrl: `${publicUrl}/admin/transactions?txId=${tx.id}`,
						...(type === "CRYPTO" && {
							transactionHash: updatedTx.txHash,
							// Update to point to the chain explorer
							transactionUrl: updatedTx?.blockchain?.explorerUrl
								? `${updatedTx.blockchain.explorerUrl}/tx/${updatedTx.txHash}`
								: `${publicUrl}/admin/transactions?txId=${tx.id}`,
						}),
						...(type === "FIAT" && {
							transactionHash: tx.id,
							transactionUrl: `${publicUrl}/admin/transactions?txId=${tx.id}`,
						}),
						transactionTime: processingTime,
						supportEmail: siteMetadata.supportEmail,
					},
				}),

				// Notify user
				this.notificator.send({
					template: "userTransactionConfirmed",
					subject: `${tx.sale.name} Transaction Confirmed | ${tx.id}`,
					to: {
						email: tx.user.email,
						name: tx.user.profile?.firstName || tx.user.profile?.lastName || "",
					},
					props: {
						userName:
							tx.user.profile?.firstName || tx.user.profile?.lastName || "",
						tokenName: tx.sale.name,
						tokenSymbol: tx.sale.tokenSymbol,
						purchaseAmount: updatedTx.totalAmount.toFixed(
							updatedTx.formOfPayment === "CRYPTO" ? 8 : 2,
						),
						tokenAmount: updatedTx.quantity.toString(),
						paidCurrency: updatedTx.paidCurrency,
						transactionTime: processingTime,
						paymentMethod: updatedTx.formOfPayment,
						walletAddress: updatedTx.receivingWallet || "",
						transactionId: updatedTx.id,
						dashboardUrl: `${publicUrl}/dashboard/transactions`,
						...(type === "CRYPTO" && {
							transactionHash: updatedTx.txHash,
							// Update to point to the chain explorer
							transactionUrl: updatedTx?.blockchain?.explorerUrl
								? `${updatedTx.blockchain.explorerUrl}/tx/${updatedTx.txHash}`
								: `${publicUrl}/dashboard/transactions?txId=${updatedTx.id}`,
						}),
						...(type === "FIAT" && {
							transactionHash: updatedTx.id,
							transactionUrl: `${publicUrl}/dashboard/transactions?txId=${updatedTx.id}`,
						}),
						supportEmail: siteMetadata.supportEmail,
						status: getEmailStatus(updatedTx),
					},
				}),
			]);

			if (shouldFinishSale) {
				// notify
				this.notificator.send({
					template: "saleEnded",
					to: admins.map((admin) => ({
						email: admin.email,
					})),
					subject: `${tx.sale.name} Ended`,
					props: {
						adminName: "Admin",
						tokenSymbol: tx.sale.tokenSymbol,
						endReason: "Maximum number of tokens sold",
						saleEndTime: new Date().toISOString(),
						// totalRaised: new Decimal(tx.totalAmount).toFixed(2),
						// tokensDistributed: tx.quantity.toString() || '0',
						dashboardUrl: `${publicUrl}/dashboard/sales`,
						supportEmail: siteMetadata.supportEmail,
					},
				});
			}

			return Success({ transaction: decimalsToString(tx) });
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	async getTransactionAvailabilityForSale(
		dto: { id: string },
		_ctx: ActionCtx,
	) {
		try {
			const transaction = await this.db.saleTransactions.findUnique({
				where: { id: dto.id },
			});
			invariant(transaction, "Transaction not found");
			return Success({
				transaction: true,
			});
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	async getCryptoTransaction(
		dto: {
			id: string;
			// Current logged in chain of the user requesting payment
			chainId: number;
		},
		ctx: ActionCtx,
	) {
		invariant(dto.chainId, "Chain ID not found");
		try {
			const tx = await this.db.saleTransactions.findUnique({
				where: {
					id: dto.id,
					user: {
						walletAddress: ctx.address,
					},
				},
				include: {
					sale: {
						include: {
							token: {
								include: {
									TokensOnBlockchains: true,
								},
							},
						},
					},
				},
			});

			// Problem here is that the sale token configuration is not really related to the payment

			invariant(tx, "Transaction not found");

			const tokenSymbol =
				dto.chainId === 97 && tx.paidCurrency === "BNB"
					? "tBNB"
					: tx.paidCurrency === "BTC"
						? "WBTC"
						: tx.paidCurrency;

			const paymentToken = await this.db.tokensOnBlockchains.findUnique({
				where: {
					tokenSymbol_chainId: {
						tokenSymbol: tokenSymbol,
						chainId: dto.chainId,
					},
				},
				select: {
					contractAddress: true,
					id: true,
					isNative: true,
					name: true,
					tokenSymbol: true,
					decimals: true,
					chainId: true,
					blockchain: {
						select: {
							id: true,
							explorerUrl: true,
							name: true,
							chainId: true,
							isTestnet: true,
							isEnabled: true,
						},
					},
				},
			});

			const { blockchain = null, ...paymentTokenData } = paymentToken || {};

			return Success({
				transaction: decimalsToString(tx),
				paymentToken: blockchain ? paymentTokenData : null,
				token: tx.sale.token,
				blockchain,
			});
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	async createPaymentSession(
		dto: { transactionId: string; method: z.infer<typeof PaymentMethod> },
		ctx: ActionCtx & { geo: Geo },
	) {
		try {
			// Get transaction and verify ownership
			const tx = await this.getTransactionById({ id: dto.transactionId }, ctx);
			invariant(tx.success && tx.data, "Transaction not found");
			// Verify transaction belongs to the user
			if (tx.data.transaction.user.walletAddress !== ctx.address) {
				throw new Error("Transaction does not belong to user");
			}

			const { session, metadata, fee } = await this.payments.createSession({
				tx: tx.data.transaction,
				method: dto.method,
				geo: ctx.geo,

			});

			console.log("🚀 ~ index.ts:1665 ~ session:", session);


			waitUntil(
				// Update transaction metadata
				prisma.saleTransactions.update({
					where: { id: tx.data.transaction.id },
					data: {
						totalAmount: session.from_amount,
						totalAmountCurrency: session.from_currency,
						amountPaidCurrency: { connect: { symbol: session.to_currency?.includes('USDC') ? 'USDC' : session.to_currency } },
						amountPaid: session.to_amount.toString(),
						metadata: metadata as Prisma.InputJsonValue,
						...(fee
							? {
								fees: {
									create: fee,
								},
							}
							: {}),
					},
				}),
			);

			return Success(session);
		} catch (e) {
			logger(e);
			return Failure(e, e instanceof InvariantError ? 400 : 500);
		}
	}

	/**
	 * Retrieves the Recipient information for the user and current transaction in case it exists
	 */
	async getRecipientForCurrentTransactionSaft(
		dto: { transactionId: string },
		ctx: ActionCtx,
	) {
		try {
			const recipient = await this.db.documentRecipient.findMany({
				where: {
					SaleTransactions: {
						id: dto.transactionId,
					},
					address: {
						equals: ctx.address,
					},
					status: {
						in: [
							DocumentSignatureStatus.SENT_FOR_SIGNATURE,
							DocumentSignatureStatus.SIGNED,
							DocumentSignatureStatus.CREATED,
						],
					},
				},
				orderBy: [{ createdAt: "desc" }],
				select: {
					id: true,
					status: true,
					email: true,
				},
			});

			if (!recipient) {
				return Success({ recipient: null });
			}
			if (recipient.length > 1) {
				return Success({ recipient: recipient[0] });
			}

			return Success({ recipient: recipient[0] });
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	private async checkMaxAllowanceWithKYC(
		dto: { amount: Prisma.Decimal; currency: string },
		ctx: ActionCtx,
	): Promise<{ result: null | KycTierType | "FAILURE" | "BLOCKED" }> {
		try {
			const { amount, currency } = dto;
			const { kycVerification: kyc } = await this.db.user.findUniqueOrThrow({
				where: {
					walletAddress: ctx.address,
				},
				select: {
					kycVerification: {
						select: {
							status: true,
							tier: true,
							rejectionReason: true,
						},
					},
				},
			});

			if (kyc?.status === KycStatusSchema.enum.REJECTED) {
				return { result: "BLOCKED" as const };
			}
			const mapping = {
				[KycTierSchema.enum.SIMPLIFIED]: 0,
				[KycTierSchema.enum.STANDARD]: 1,
				[KycTierSchema.enum.ENHANCED]: 2,
			};

			let usdAmount = amount;
			if (currency !== "USD") {
				const data = await rates.getExchangeRate(currency, "USD");
				if (!data?.success || !data.data?.[currency]) {
					return { result: "FAILURE" };
				}
				const TO = "USD";
				const exRate = data.data?.[currency]?.[TO];
				if (!exRate) {
					return { result: "FAILURE" };
				}
				usdAmount = usdAmount.mul(exRate);
			}

			function getDerivedTier(amount: Prisma.Decimal): KycTierType | undefined {
				if (amount.lessThanOrEqualTo(new Prisma.Decimal("1000"))) {
					return KycTierSchema.enum.SIMPLIFIED;
				}
				if (
					amount.greaterThan(new Prisma.Decimal("1000")) &&
					amount.lessThanOrEqualTo(new Prisma.Decimal("10000"))
				) {
					return KycTierSchema.enum.STANDARD;
				}
				if (amount.greaterThan(new Prisma.Decimal("10000"))) {
					return KycTierSchema.enum.ENHANCED;
				}
			}

			const derivedTier = getDerivedTier(usdAmount);
			const currentTierScore = mapping[kyc?.tier as KycTierType];
			const targetTierScore = mapping[derivedTier as KycTierType];

			// if current is higher than target means we don't need to perform new KYC.
			// if current is equal to target AND status is VERIFIED or SUBMITTED means we don't need to perform new KYC.
			// if current is equal to target AND status is other, we need to ask for the same verification.
			// If current is lower than target, we need to perform new KYC.

			let resultTier: KycTierType | null;

			if (currentTierScore > targetTierScore) {
				// Current tier is higher, no new KYC needed
				resultTier = null;
			} else if (currentTierScore === targetTierScore) {
				// Same tier level
				if (
					kyc?.status === KycStatusSchema.enum.VERIFIED ||
					kyc?.status === KycStatusSchema.enum.SUBMITTED
				) {
					// Status is verified/submitted, no new KYC needed
					resultTier = null;
				} else {
					// Need to verify at current tier
					resultTier = kyc?.tier as KycTierType | null;
				}
			} else {
				// Current tier is lower, need new KYC at derived tier
				resultTier = derivedTier || "ENHANCED";
			}

			return {
				result:
					resultTier === null ? null : resultTier || kyc?.tier || "FAILURE",
			};
		} catch (e) {
			logger(e);
			return { result: "FAILURE" };
		}
	}

	/**
	 * Helper function used to cancel a transaction and restore the available token quantity.
	 * Should always be called when cancelling a transaction to ensure units are restored.
	 */
	private async cancelTransactionAndRestoreUnits(
		tx: Pick<SaleTransactions, "id" | "saleId" | "quantity" | "userId">,
		reason?: string,
	) {
		return this.db.$transaction([
			this.db.sale.update({
				where: {
					id: tx.saleId,
				},
				data: {
					availableTokenQuantity: {
						increment: tx.quantity.toNumber(),
					},
				},
			}),
			this.db.saleTransactions.update({
				where: {
					id: tx.id,
					userId: tx.userId,
				},
				data: {
					status: TransactionStatus.CANCELLED,
					comment:
						reason ||
						"Transaction cancelled for not being confirmed after time limit",
				},
			}),
		]);
	}

	/**
	 * Compute missing variables by comparing required variables with available ones.
	 * @param requiredVariables - Array of required variable names from the SAFT contract
	 * @param availableVariables - Object containing available variables with their values
	 * @returns Array of variable names that are missing or have null/undefined values
	 */
	private computeMissingVariables(
		requiredVariables: SaftContract["variables"],
		availableVariables: Record<string, unknown>,
	): string[] {
		if (!Array.isArray(requiredVariables)) {
			return [];
		}

		const missingVariables: string[] = [];

		for (const variable of requiredVariables) {
			if (typeof variable !== "string") {
				continue;
			}

			// Check if the variable exists in the available variables
			const value = this.getNestedValue(availableVariables, variable);

			// Consider null, undefined, or empty string as missing
			if (value === null || value === undefined || value === "") {
				missingVariables.push(variable);
			}
		}

		return missingVariables;
	}

	/**
	 * Get a nested value from an object using dot notation (e.g., "recipient.firstName").
	 * @param obj - The object to search in
	 * @param path - The dot-notation path to the value
	 * @returns The value at the path or undefined if not found
	 */
	private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
		const keys = path.split(".");
		let current: unknown = obj;

		for (const key of keys) {
			if (
				current === null ||
				current === undefined ||
				typeof current !== "object"
			) {
				return undefined;
			}
			current = (current as Record<string, unknown>)[key];
		}

		return current;
	}

	/**
	 * Helper to set a value in an object using dot notation, creating nested objects as needed.
	 * @param obj - The object to modify
	 * @param path - The dot-notated path (e.g., 'recipient.firstName')
	 * @param value - The value to set
	 */
	private setNestedValue(
		obj: Record<string, unknown>,
		path: string,
		value: unknown,
	) {
		if (!path) return;
		const keys = path.split(".").filter(Boolean);
		if (keys.length === 0) return;
		let current: Record<string, unknown> = obj;
		for (let i = 0; i < keys.length - 1; i++) {
			const key = keys[i]!;
			if (
				!(key in current) ||
				typeof current[key] !== "object" ||
				current[key] === null
			) {
				current[key] = {};
			}
			current = current[key] as Record<string, unknown>;
		}
		current[keys[keys.length - 1]!] = value;
	}

	/**
	 * Helper function used to populate tx/user/sale information into the contract variables object.
	 */
	parseTransactionVariablesToContract({
		tx,
		user,
		profile,
		address,
		sale,
		contract,
		inputVariables,
	}: {
		tx: SaleTransactions;
		sale: Pick<Sale, "currency" | "tokenPricePerUnit" | "tokenName">;
		contract: SaftContract["content"];
		inputVariables?: Record<string, string | Record<string, string>>;
		user?: Partial<User> | null;
		profile?: Partial<Profile> | null;
		address?: Partial<Address> | null;
	}) {
		const DISALLOWED_VARIABLES = ["token", "paid", "sale", "date"];
		const computedVariables = {
			recipient: {
				// profile
				firstName: profile?.firstName || null,
				lastName: profile?.lastName || null,
				email: user?.email || null,
				// address
				street: address?.street || null,
				city: address?.city || null,
				zipcode: address?.zipCode || null,
				state: address?.state || null,
				country: address?.country || null,
			},
			// Purchase
			token: {
				quantity: tx.quantity.toString() || null,
				symbol: tx.tokenSymbol,
				name: sale.tokenName,
			},
			paid: {
				currency: tx.paidCurrency || null,
				amount:
					tx.totalAmount?.toFixed(
						FIAT_CURRENCIES.includes(tx.paidCurrency) ? 4 : 8,
					) || null,
			},
			sale: {
				currency: sale.currency || null,
				equivalentAmount:
					new Prisma.Decimal(tx.quantity)
						.mul(sale.tokenPricePerUnit)
						.toFixed(2) || null,
			},
			date: new Date().toISOString().split("T")[0],
		};

		const inputObject = {};
		// Merge inputVariables into computedVariables using dot notation
		if (inputVariables && Object.keys(inputVariables).length > 0) {
			for (const key in inputVariables) {
				// Check to aovoid modifying the computed variables
				if (DISALLOWED_VARIABLES.includes(key)) {
					continue;
				}
				if (inputVariables[key]) {
					this.setNestedValue(inputObject, key, inputVariables[key]);
				}
			}
		}
		const variables = deepmerge(computedVariables, inputObject);
		const template = Handlebars.compile(contract);
		const fullContract = template(variables);

		return { contract: fullContract, variables };
	}
}

export default new TransactionsController(
	prisma,
	notificatorService,
	new PaymentsService(new InstaxchangeService()),
);
