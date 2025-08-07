import 'server-only';
import {
  FIAT_CURRENCIES,
  MAX_ALLOWANCE_WITHOUT_KYC,
} from '@/common/config/constants';
import { ActionCtx } from '@/common/schemas/dtos/sales';
import {
  CreateTransactionDto,
  GetTransactionDto,
  UpdateTransactionDto,
} from '@/common/schemas/dtos/transactions';
import {
  decimalsToString,
  Failure,
  Success,
} from '@/common/schemas/dtos/utils';
import { prisma } from '@/db';
import logger from '@/lib/services/logger.server';
import { invariant } from '@epic-web/invariant';
import {
  DocumentSignatureStatus,
  FOP,
  Sale,
  SaleStatus,
  SaleTransactions,
  TransactionStatus,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import Handlebars from 'handlebars';
import { DateTime } from 'luxon';
import {
  Address,
  DocumentSignatureStatusSchema,
  Profile,
  SaftContract,
  SignableDocumentRoleSchema,
  User,
} from '@/common/schemas/generated';
import documentsController from '../documents';
import notificatorService, { Notificator } from '../notifications';
import { publicUrl } from '@/common/config/env';
import { metadata } from '@/common/config/site';
import { TransactionValidator } from './validator';
import {
  AdminTransactionsWithRelations,
  TransactionByIdWithRelations,
  TransactionWithRelations,
} from '@/common/types/transactions';

class TransactionsController {
  private documents;
  private readonly notificator: Notificator;

  constructor(readonly _notificator: Notificator) {
    this.documents = documentsController;
    this.notificator = _notificator;
  }

  /**
   * Get all transactions (admin only).
   */
  async getAllTransactions(dto: { saleId?: string }, ctx: ActionCtx) {
    try {
      invariant(ctx.isAdmin, 'Forbidden');
      const transactions: AdminTransactionsWithRelations[] =
        await prisma.saleTransactions.findMany({
          ...(dto.saleId && { where: { saleId: dto.saleId } }),
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
          orderBy: { createdAt: 'desc' },
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
    ctx: ActionCtx
  ) {
    try {
      invariant(ctx.isAdmin, 'Forbidden');
      invariant(dto.id, 'Id missing');
      const { id, requiresKYC } = dto;
      const tx = await prisma.saleTransactions.update({
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
        await prisma.user.update({
          where: { id: tx.user.id },
          data: {
            kycVerification: {
              upsert: {
                create: { status: 'VERIFIED' },
                update: { status: 'VERIFIED' },
              },
            },
          },
        });
      }

      if (dto.status === TransactionStatus.PAYMENT_VERIFIED) {
        await this.notificator.send({
          template: 'paymentVerified',
          to: [{ email: tx.user.email }],
          subject: `Payment verified for ${tx.sale.name} | ${tx.id}`,
          props: {
            userName: tx.user.name,
            tokenName: tx.sale.name,
            tokenSymbol: tx.sale.tokenSymbol,
            purchaseAmount: tx.amountPaid || '0',
            tokenAmount: tx.quantity.toString(),
            transactionHash: tx.txHash,
            transactionTime:
              tx.paymentDate?.toISOString() || new Date().toISOString(),
            paymentMethod: tx.formOfPayment,
            walletAddress: tx.receivingWallet || tx.user.walletAddress,
            transactionId: tx.id,
            supportEmail: metadata.supportEmail,
            paidCurrency: tx.paidCurrency,
          },
        });
      }
      if (dto.status === TransactionStatus.REJECTED) {
        await this.notificator.send({
          template: 'transactionRejected',
          to: [{ email: tx.user.email }],
          subject: `${tx.sale.name} Transaction Rejected | ${tx.id}`,
          props: {
            userName: tx.user.name,
            tokenName: tx.sale.name,
            tokenSymbol: tx.sale.tokenSymbol,
            purchaseAmount: tx.amountPaid || '0',
            transactionHash: tx.txHash,
            transactionTime:
              tx.paymentDate?.toISOString() || new Date().toISOString(),
            paymentMethod: tx.formOfPayment,
            walletAddress: tx.receivingWallet || tx.user.walletAddress,
            transactionId: tx.id,
            rejectionReason: tx.rejectionReason || dto.comment,
            supportEmail: metadata.supportEmail,
            paidCurrency: tx.paidCurrency,
          },
        });
      }

      return Success({ transaction: decimalsToString(tx) });
    } catch (error) {
      logger(error);
      return Failure(error);
    }
  }

  /**
   * Update a transaction (admin only).
   */
  async updateTransactionStatus(
    dto: { id: string; status: TransactionStatus },
    ctx: ActionCtx
  ) {
    invariant(ctx.isAdmin, 'Forbidden');
    invariant(dto.id, 'Id missing');
    invariant(dto.status, 'Status missing');
    try {
      const transaction = await prisma.saleTransactions.update({
        where: { id: String(dto.id) },
        data: { status: dto.status },
        include: { sale: true, user: { include: { profile: true } } },
      });
      return Success({ transaction });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  /**
   * Get all transactions for a user (optionally filtered by sale or symbol).
   */
  async getUserTransactions(
    dto: Omit<GetTransactionDto, 'userId'>,
    ctx: ActionCtx
  ) {
    try {
      const { formOfPayment, tokenSymbol: symbol, saleId: sale } = dto;
      let userId = ctx.userId;
      const address = ctx.address;

      if (!userId) {
        const user = await prisma.user.findUniqueOrThrow({
          where: { walletAddress: address },
          select: { id: true },
        });
        userId = user.id;
      }
      let saleId: string | undefined = sale;
      const andQuery: { saleId?: string; tokenSymbol?: string }[] = [];
      if (sale === 'current') {
        saleId = (
          await prisma.sale.findFirst({ where: { status: SaleStatus.OPEN } })
        )?.id;
        andQuery.push({ saleId });
      }
      if (symbol) andQuery.push({ tokenSymbol: symbol });
      const transactions: TransactionWithRelations[] =
        await prisma.saleTransactions.findMany({
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
          orderBy: { createdAt: 'desc' },
        });

      return Success({
        transactions: transactions.map((t) =>
          decimalsToString({
            ...t,
            explorerUrl: !t.txHash
              ? null
              : `${t?.blockchain?.explorerUrl}/tx/${t.txHash}`,
          })
        ),
      });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  async getTransactionById(dto: { id: string }, _ctx: ActionCtx) {
    try {
      const transaction = await prisma.saleTransactions.findUnique({
        where: { id: String(dto.id) },
        include: {
          sale: {
            select: {
              id: true,
              name: true,
              requiresKYC: true,
              saftCheckbox: true,
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
        },
      });

      invariant(transaction, 'Transaction not found');

      return Success({
        transaction: decimalsToString(
          transaction
        ) as TransactionByIdWithRelations,
        requiresKYC: transaction.sale.requiresKYC,
        requiresSAFT: transaction.sale.saftCheckbox,
        explorerUrl: transaction.txHash
          ? `${transaction.sale.blockchain?.explorerUrl}/tx/${transaction.txHash}`
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
      } = dto;
      const userId = ctx.userId;
      invariant(saleId, 'Sale id missing');
      invariant(userId, 'User id missing');

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
      const [_updtSale, transaction] = await prisma.$transaction([
        prisma.sale.update({
          where: { id: saleId },
          data: { availableTokenQuantity: { decrement: Number(quantity) } },
          select: {
            availableTokenQuantity: true,
            id: true,
          },
        }),
        prisma.saleTransactions.create({
          data: {
            tokenSymbol,
            quantity: new Prisma.Decimal(quantity),
            formOfPayment,
            receivingWallet,
            comment,
            status: TransactionStatus.PENDING,
            paidCurrency,
            saleId,
            userId,
            rawPrice: totalAmount.toString(),
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
            rawPrice: true,
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
   * Delete all transactions (dev only).
   */
  async deleteAllTransactions() {
    invariant(process.env.NODE_ENV === 'development', 'Forbidden');
    try {
      const transaction = await prisma.saleTransactions.deleteMany();
      return Success({ transaction });
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
      invariant(dto.id, 'Transaction id missing');
      invariant(ctx.userId, 'User id missing');
      const tx = await prisma.saleTransactions.findUnique({
        where: { id: String(dto.id), userId: ctx.userId },
        select: {
          id: true,
          saleId: true,
          quantity: true,
          userId: true,
          status: true,
        },
      });
      invariant(tx, 'Transaction not found');

      if (
        ![
          TransactionStatus.AWAITING_PAYMENT,
          TransactionStatus.PENDING,
        ].includes(tx.status)
      ) {
        throw new Error(
          `Transaction cannot be deleted due to status: ${tx.status}`
        );
      }
      await this.cancelTransactionAndRestoreUnits(tx, 'Cancelled by user');
      return Success({ id: tx.id });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  /**
   * Update a transaction by id.
   */
  async updateTransactionById(
    dto: { id: string } & UpdateTransactionDto,
    _ctx: ActionCtx
  ) {
    try {
      invariant(dto.id, 'Transaction id missing');
      const transaction = await prisma.saleTransactions.update({
        where: { id: String(dto.id) },
        data: { ...dto },
      });
      return Success({ transaction });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  public crons = {
    cleanUp: async () => {
      console.debug(
        `Running transactions cleanup cronjob: ${DateTime.now().toLocaleString(DateTime.DATETIME_FULL)}`
      );
      console.time('transactions-cleanup');
      const sixHoursAgo = DateTime.local().minus({ hours: 6 }).toJSDate();

      try {
        const txs = await prisma.saleTransactions.findMany({
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

        await prisma.$transaction(async (prisma) => {
          await prisma.saleTransactions.updateMany({
            where: {
              id: { in: txs.map((tx) => tx.id) },
            },
            data: {
              status: TransactionStatus.CANCELLED,
              comment:
                'Transaction cancelled for not being confirmed after time limit',
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
              return prisma.sale.update({
                where: { id: saleId },
                data: {
                  availableTokenQuantity: {
                    increment: quantityToReturn.toNumber(),
                  },
                },
              });
            })
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
                    ? `${tx.user.profile.firstName} ${tx.user.profile.lastName || ''}`.trim()
                    : undefined,
                },
                subject: 'Transaction cancelled',
                template: 'transactionCancelled',
                props: {
                  userName: tx.user.profile?.firstName
                    ? `${tx.user.profile.firstName} ${tx.user.profile.lastName || ''}`.trim()
                    : tx.user.email,
                  saleName: tx.sale.name,
                  transactionId: tx.id,
                  quantity: tx.quantity.toString(),
                  tokenSymbol: tx.sale.tokenSymbol,
                  reason:
                    'Transaction cancelled for not being confirmed after time limit',
                  supportEmail: metadata.supportEmail,
                },
              })
            )
        );

        return Success({});
      } catch (e) {
        logger(e);
        return Failure(e);
      } finally {
        console.timeEnd('transactions-cleanup');
      }
    },
  };

  /**
   * Get pending contact transactions for a user in the current open sale.
   */
  async pendingContactTransactions(_dto: unknown, ctx: ActionCtx) {
    try {
      invariant(ctx.userId, 'Not authorized');
      const sale = await prisma.sale.findFirst({ where: { status: 'OPEN' } });
      invariant(sale, 'There is no open sale');
      const pendingTransaction = await prisma.saleTransactions.findFirst({
        where: {
          AND: [{ saleId: sale.id, userId: ctx.userId }, { status: 'PENDING' }],
        },
      });
      invariant(pendingTransaction, 'There are no pending transactions');
      let responseData = {};
      if (pendingTransaction.agreementId) {
        // const data = await urlContract(pendingTransaction.agreementId);
        const data = { isSign: false, urlSign: null };
        responseData = {
          isSign: data.isSign || null,
          urlSign: data.urlSign || null,
        };
      }
      return Success(responseData);
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  /**
   * Get user transactions for a specific sale.
   */
  async userTransactionsForSale(
    dto: { saleId: string; status?: TransactionStatus[] },
    ctx: ActionCtx
  ) {
    try {
      const { saleId, status: _status } = dto;
      invariant(saleId, 'Sale not found');
      const transactions = await prisma.saleTransactions.findMany({
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
    ctx: ActionCtx
  ) {
    // Here we need to get the contract, update the variables with new information and call the documenso service to generate
    // contract. generate an ID in and store it in our DB, respond FASt. cannot wait for documenso generateion will need to add webhook.
    try {
      //TODO! add own user check?
      // 1) Fetch contract and recompute variables
      const result = await this.getSaleSaftForTransaction(
        { txId: dto.transactionId, variables: dto.variables },
        ctx
      );
      invariant(result.success, 'Failed to get sale saft for transaction');
      const { content } = result.data;
      const user = await prisma.user.findUnique({
        where: { walletAddress: ctx.address },
        select: {
          email: true,
          id: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      });
      invariant(user, 'User not found');
      const fullname =
        user?.profile?.firstName || user.profile?.lastName
          ? `${user.profile?.firstName} ${user.profile?.lastName}`
          : '';

      // 2) Generate contract reference in our own DB and call documenso service to generate the HTML
      const recipient = await prisma.documentRecipient.create({
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

      void this.documents
        .generatePDF({
          content,
          title: `Token SAFT | tx:${dto.transactionId} | ${user.id}:${user.email}`,
          recipients: [{ email: user.email, name: fullname }],
          reference: recipient.id,
        })
        .catch(async (e) => {
          await prisma.documentRecipient.update({
            where: { id: recipient.id },
            data: {
              status: DocumentSignatureStatusSchema.enum.ERROR,
            },
          });
          logger(e);
        });

      console.log('SIGUE?', recipient.id);

      return Success({
        id: recipient.id,
      });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  async getContractForTransaction(
    dto: { txId: string; recipientId: string },
    _ctx: ActionCtx
  ) {
    try {
      //TODO! add own user check?
      const recipient = await prisma.documentRecipient.findUnique({
        where: { id: dto.recipientId },
      });
      return Success({
        recipient,
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
    _ctx: ActionCtx
  ) {
    // We need to retrieve the saft content for the sale.
    // We need to replace default variables with the ones from the transaction.
    // We need ot send it to the front end for review with puplated vars
    try {
      const transaction = await prisma.saleTransactions.findUnique({
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
      invariant(transaction, 'Transaction not found');
      const saftContract = transaction?.sale?.saftContract;
      invariant(saftContract, 'SAFT template not found in transaction');

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
        contractVariables.variables
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
    ctx: ActionCtx
  ) {
    try {
      const recipient = await prisma.documentRecipient.findUnique({
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
      invariant(recipient, 'Recipient not found');
      return Success({
        recipient,
      });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  async confirmTransaction(
    {
      id,
      type,
      payload,
    }: {
      id: string;
      type: 'CRYPTO' | 'FIAT';
      payload?: {
        formOfPayment?: FOP;
        confirmationId?: string;
        receivingWallet?: string;
        comment?: string;
        txHash?: string;
        chainId?: number;
        amountPaid?: string;
        paymentDate?: Date;
        paymentEvidenceId?: string;
      };
    },
    ctx: ActionCtx
  ) {
    try {
      // Only the user who created the transaction can confirm it
      const [tx, admins] = await Promise.all([
        prisma.saleTransactions.findUniqueOrThrow({
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
        prisma.user.findMany({
          where: {
            userRole: {
              some: {
                role: { name: { in: ['ADMIN', 'SUPER_ADMIN'] } },
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

      // Check if the sale has enough tokens available
      // TODO! This should be done before actually confriming payment of the tx
      // if (
      //   new Prisma.Decimal(tx.sale.availableTokenQuantity).lessThan(tx.quantity)
      // ) {
      //   invariant(false, 'Not enough tokens available to confirm transaction');
      // }

      const shouldFinishSale = new Prisma.Decimal(
        tx.sale.availableTokenQuantity
      ).equals(tx.quantity);

      const { chainId, paymentEvidenceId, ...rest } = payload || {};
      const [updatedTx] = await prisma.$transaction([
        prisma.saleTransactions.update({
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
            amountPaid: tx.totalAmount.toString(),
            paymentDate: new Date(),
            ...(paymentEvidenceId && {
              paymentEvidence: {
                connect: {
                  id: paymentEvidenceId,
                },
              },
            }),
            ...rest,
          },
        }),
        prisma.sale.update({
          where: { id: tx.saleId },
          data: {
            ...(shouldFinishSale && { status: SaleStatus.FINISHED }),
            availableTokenQuantity: {
              decrement: tx.quantity.toNumber(),
            },
          },
        }),
      ]);

      await Promise.allSettled([
        // Notify admin
        this.notificator.send({
          template: 'adminTransactionConfirmed',
          to: admins.map((admin) => ({
            email: admin.email,
          })),
          subject: `${tx.sale.name} Transaction Confirmed | ${tx.id}`,
          props: {
            adminName: 'Admin',
            userName:
              tx.user.profile?.firstName || tx.user.profile?.lastName || 'User',
            userEmail: tx.user.email,
            tokenName: tx.sale.name,
            tokenSymbol: tx.sale.tokenSymbol,
            purchaseAmount: updatedTx.totalAmount.toString(),
            tokenAmount: updatedTx.quantity.toString(),
            transactionId: updatedTx.id,
            paidCurrency: updatedTx.paidCurrency,
            ...(type === 'CRYPTO' && {
              transactionHash: updatedTx.txHash,
              // Update to point to the chain explorer
              transactionUrl: tx?.blockchain?.explorerUrl
                ? `${tx.blockchain.explorerUrl}/tx/${updatedTx.txHash}`
                : `${publicUrl}/admin/transactions?txId=${tx.id}`,
            }),
            ...(type === 'FIAT' && {
              transactionHash: tx.id,
              transactionUrl: `${publicUrl}/admin/transactions?txId=${tx.id}`,
            }),
            transactionTime: new Date().toISOString(),
          },
        }),
        // Notify user
        this.notificator.send({
          template: 'userTransactionConfirmed',
          subject: `${tx.sale.name} Transaction Confirmed | ${tx.id}`,
          to: {
            email: tx.user.email,
            name:
              tx.user.profile?.firstName || tx.user.profile?.lastName || 'user',
          },
          props: {
            userName:
              tx.user.profile?.firstName || tx.user.profile?.lastName || 'user',
            tokenName: tx.sale.name,
            tokenSymbol: tx.sale.tokenSymbol,
            purchaseAmount: updatedTx.totalAmount.toFixed(
              updatedTx.formOfPayment === 'CRYPTO' ? 8 : 2
            ),
            tokenAmount: updatedTx.quantity.toString(),
            transactionTime: new Date().toISOString(),
            paymentMethod: updatedTx.formOfPayment,
            walletAddress: updatedTx.receivingWallet || '',
            transactionId: updatedTx.id,
            dashboardUrl: `${publicUrl}/dashboard/transactions`,
            ...(type === 'CRYPTO' && {
              transactionHash: updatedTx.txHash,
              // Update to point to the chain explorer
              transactionUrl: tx?.blockchain?.explorerUrl
                ? `${tx.blockchain.explorerUrl}/tx/${updatedTx.txHash}`
                : `${publicUrl}/dashboard/transactions?txId=${updatedTx.id}`,
            }),
            ...(type === 'FIAT' && {
              transactionHash: updatedTx.id,
              transactionUrl: `${publicUrl}/dashboard/transactions?txId=${updatedTx.id}`,
            }),
            supportEmail: metadata.supportEmail,
          },
        }),
      ]);

      if (shouldFinishSale) {
        // notify
        this.notificator.send({
          template: 'saleEnded',
          to: admins.map((admin) => ({
            email: admin.email,
          })),
          subject: `${tx.sale.name} Ended`,
          props: {
            adminName: 'Admin',
            tokenSymbol: tx.sale.tokenSymbol,
            endReason: 'Maximum number of tokens sold',
            saleEndTime: new Date().toISOString(),
            // totalRaised: new Decimal(tx.totalAmount).toFixed(2),
            // tokensDistributed: tx.quantity.toString() || '0',
            dashboardUrl: `${publicUrl}/dashboard/sales`,
            supportEmail: metadata.supportEmail,
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
    _ctx: ActionCtx
  ) {
    try {
      const transaction = await prisma.saleTransactions.findUnique({
        where: { id: dto.id },
      });
      invariant(transaction, 'Transaction not found');
      return Success({
        transaction: true,
      });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  async getCryptoTransaction(dto: { id: string }, ctx: ActionCtx) {
    try {
      const transaction = await prisma.saleTransactions.findUnique({
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
      invariant(transaction, 'Transaction not found');
      const blockchain = transaction.sale.token.TokensOnBlockchains?.[0];
      invariant(blockchain, 'Blockchain not found');

      const paymentToken = await prisma.tokensOnBlockchains.findUnique({
        where: {
          tokenSymbol_chainId: {
            tokenSymbol:
              blockchain.chainId === 97 && transaction.paidCurrency === 'BNB'
                ? 'tBNB'
                : transaction.paidCurrency,
            chainId: blockchain.chainId,
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
        },
      });

      return Success({
        transaction: decimalsToString(transaction),
        paymentToken,
        token: transaction.sale.token,
        blockchain,
      });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  /**
   * Retrieves the Recipient information for the user and current transaction in case it exists
   */
  async getRecipientForCurrentTransactionSaft(
    dto: { transactionId: string },
    ctx: ActionCtx
  ) {
    try {
      const recipient = await prisma.documentRecipient.findMany({
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
        orderBy: [{ createdAt: 'desc' }],
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

  private checkMaxAllowanceWithoutKYC(
    boughtTokenQuantity: string,
    sale: Pick<Sale, 'tokenPricePerUnit' | 'currency'>
  ) {
    if (
      !boughtTokenQuantity ||
      isNaN(parseInt(boughtTokenQuantity)) ||
      !sale?.tokenPricePerUnit
    ) {
      invariant(
        false,
        'Invalid token quantity or token price while checking max KYC allowance'
      );
    }
    if (
      new Prisma.Decimal(boughtTokenQuantity)
        .mul(sale.tokenPricePerUnit)
        .greaterThan(MAX_ALLOWANCE_WITHOUT_KYC)
    ) {
      invariant(
        false,
        `SIWE users are entitled to make transactions up to ${MAX_ALLOWANCE_WITHOUT_KYC}${sale.currency} without KYC`
      );
    }
  }

  /**
   * Helper function used to cancel a transaction and restore the available token quantity.
   * Should always be called when cancelling a transaction to ensure units are restored.
   */
  private async cancelTransactionAndRestoreUnits(
    tx: Pick<SaleTransactions, 'id' | 'saleId' | 'quantity' | 'userId'>,
    reason?: string
  ) {
    return prisma.$transaction([
      prisma.sale.update({
        where: {
          id: tx.saleId,
        },
        data: {
          availableTokenQuantity: {
            increment: tx.quantity.toNumber(),
          },
        },
      }),
      prisma.saleTransactions.update({
        where: {
          id: tx.id,
          userId: tx.userId,
        },
        data: {
          status: TransactionStatus.CANCELLED,
          comment:
            reason ||
            'Transaction cancelled for not being confirmed after time limit',
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
    requiredVariables: SaftContract['variables'],
    availableVariables: Record<string, unknown>
  ): string[] {
    if (!Array.isArray(requiredVariables)) {
      return [];
    }

    const missingVariables: string[] = [];

    for (const variable of requiredVariables) {
      if (typeof variable !== 'string') {
        continue;
      }

      // Check if the variable exists in the available variables
      const value = this.getNestedValue(availableVariables, variable);

      // Consider null, undefined, or empty string as missing
      if (value === null || value === undefined || value === '') {
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
    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
      if (
        current === null ||
        current === undefined ||
        typeof current !== 'object'
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
    value: unknown
  ) {
    if (!path) return;
    const keys = path.split('.').filter(Boolean);
    if (keys.length === 0) return;
    let current: Record<string, unknown> = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]!;
      if (
        !(key in current) ||
        typeof current[key] !== 'object' ||
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
    sale: Pick<Sale, 'currency' | 'tokenPricePerUnit'>;
    contract: SaftContract['content'];
    inputVariables?: Record<string, string | Record<string, string>>;
    user?: Partial<User> | null;
    profile?: Partial<Profile> | null;
    address?: Partial<Address> | null;
  }) {
    const DISALLOWED_VARIABLES = ['token', 'paid', 'sale', 'date'];
    const computedVariables = {
      recipient: {
        // profile
        firstName: profile?.firstName || null,
        lastName: profile?.lastName || null,
        email: user?.email || null,
        // address
        city: address?.city || null,
        zipcode: address?.zipCode || null,
        state: address?.state || null,
        country: address?.country || null,
      },
      // Purchase
      token: {
        quantity: tx.quantity.toString() || null,
        symbol: tx.tokenSymbol,
      },
      paid: {
        currency: tx.paidCurrency || null,
        amount:
          tx.totalAmount?.toFixed(
            FIAT_CURRENCIES.includes(tx.paidCurrency) ? 4 : 8
          ) || null,
      },
      sale: {
        currency: sale.currency || null,
        equivalentAmount:
          new Prisma.Decimal(tx.quantity)
            .mul(sale.tokenPricePerUnit)
            .toFixed(2) || null,
      },
      date: new Date().toISOString().split('T')[0],
    };

    // Merge inputVariables into computedVariables using dot notation
    if (inputVariables && Object.keys(inputVariables).length > 0) {
      for (const key in inputVariables) {
        // Check to aovoid modifying the computed variables
        if (DISALLOWED_VARIABLES.includes(key)) {
          continue;
        }
        if (inputVariables[key]) {
          this.setNestedValue(computedVariables, key, inputVariables[key]);
        }
      }
    }

    const template = Handlebars.compile(contract);
    const fullContract = template(computedVariables);

    return { contract: fullContract, variables: computedVariables };
  }
}

export default new TransactionsController(notificatorService);
