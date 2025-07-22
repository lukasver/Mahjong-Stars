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
  Currency,
  FOP,
  Sale,
  SaleStatus,
  SaleTransactions,
  TransactionStatus,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
// import Handlebars from 'handlebars';
import { DateTime } from 'luxon';
import {
  Address,
  Profile,
  SaftContract,
  User,
} from '@/common/schemas/generated';
// import { urlContract, UrlContract } from '@/lib/services/adobe.service';

class TransactionsController {
  /**
   * Get all transactions (admin only).
   */
  async getAllTransactions(_dto: unknown, ctx: ActionCtx) {
    try {
      invariant(ctx.isAdmin, 'Forbidden');
      const transactions = await prisma.saleTransactions.findMany({
        include: {
          sale: true,
          user: { include: { profile: true } },
        },
      });
      return Success({ transactions, quantity: transactions.length });
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
  async adminUpdateTransaction(dto: UpdateTransactionDto, ctx: ActionCtx) {
    try {
      invariant(ctx.isAdmin, 'Forbidden');
      invariant(dto.id, 'Id missing');
      invariant(dto.status, 'Status missing');
      const transaction = await prisma.saleTransactions.update({
        where: { id: String(dto.id) },
        data: { status: dto.status },
        include: {
          sale: true,
          user: {
            include: {
              profile: true,
            },
          },
        },
      });
      return Success({ transaction });
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
  async getUserTransactions(dto: GetTransactionDto, _ctx: ActionCtx) {
    try {
      const { userId, formOfPayment, tokenSymbol: symbol, saleId: sale } = dto;
      invariant(userId, 'User id missing');
      let saleId: string | undefined = sale;
      const andQuery: { saleId?: string; tokenSymbol?: string }[] = [];
      if (sale === 'current') {
        saleId = (
          await prisma.sale.findFirst({ where: { status: SaleStatus.OPEN } })
        )?.id;
        andQuery.push({ saleId });
      }
      if (symbol) andQuery.push({ tokenSymbol: symbol });
      const transactions = await prisma.saleTransactions.findMany({
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
      });
      return Success({ transactions });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  async getTransactionById(dto: { id: string }, _ctx: ActionCtx) {
    try {
      const transaction = await prisma.saleTransactions.findUnique({
        where: { id: String(dto.id) },
        select: {
          sale: {
            select: {
              id: true,
              requiresKYC: true,
              saftCheckbox: true,
              tokenSymbol: true,
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
        transaction,
        requiresKYC: transaction.sale.requiresKYC,
        requiresSAFT: transaction.sale.saftCheckbox,
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
        amountPaid,
        paidCurrency,
      } = dto;
      const userId = ctx.userId;
      invariant(saleId, 'Sale id missing');
      invariant(userId, 'User id missing');
      const sale = await prisma.sale.findUnique({
        where: {
          id: saleId,
          status: SaleStatus.OPEN,
          availableTokenQuantity: { gte: quantity.toNumber() },
        },
      });
      invariant(sale, 'Sale not found');

      if (
        new Prisma.Decimal(quantity).greaterThan(sale.availableTokenQuantity)
      ) {
        return Failure('Cannot buy more tokens than available amount', 400);
      }
      // Check for pending transaction
      const pendingTransaction = await prisma.saleTransactions.findFirst({
        where: {
          status: {
            in: [TransactionStatus.PENDING, TransactionStatus.AWAITING_PAYMENT],
          },
          saleId,
          user: { walletAddress: ctx.address },
        },
      });
      invariant(
        !pendingTransaction,
        'Cannot create a new transaction if user has a pending one'
      );

      // Check requirement
      if (sale.requiresKYC) {
        // TODO: Check if user has KYC
      }

      if (sale.saftCheckbox) {
        // TODO: Check if user has SAFT
      }

      // this.checkMaxAllowanceWithoutKYC(quantity.toString(), sale);

      // TODO: Add contract/SAFT logic if needed
      // TODO: Calculate rawPrice, price, totalAmount correctly

      const transaction = await prisma.$transaction(async (tx) => {
        tx.sale.update({
          where: { id: saleId },
          data: { availableTokenQuantity: { decrement: Number(quantity) } },
        });
        const price = new Prisma.Decimal(amountPaid);
        return tx.saleTransactions.create({
          data: {
            tokenSymbol,
            quantity: new Prisma.Decimal(quantity),
            formOfPayment,
            receivingWallet,
            comment,
            status: TransactionStatus.PENDING,
            amountPaid,
            paidCurrency,
            saleId,
            userId,
            rawPrice: amountPaid,
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
        });
      });

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
        },
      });
      invariant(tx, 'Transaction not found');
      await this.cancelTransactionAndRestoreUnits(tx);
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

  async pendingCronJobTransactions() {
    const sixHoursAgo = DateTime.local().minus({ hours: 6 }).toJSDate();
    // const oneMinuteAgo = DateTime.local().minus({ minutes: 1 }).toJSDate();

    try {
      const transactions = await prisma.saleTransactions.findMany({
        where: {
          AND: [
            { status: TransactionStatus.PENDING },
            { NOT: { formOfPayment: FOP.CRYPTO } },
            {
              sale: {
                status: SaleStatus.OPEN,
              },
            },
            {
              createdAt: { lte: sixHoursAgo },
            },
          ],
        },
      });
      // Process transactions that are not paid in crypto
      if (transactions.length > 0) {
        await Promise.all(
          transactions.map((transaction) =>
            deleteTransactionAndRestoreUnits(transaction)
          )
        );
      }

      const cryptoTransactions = await prisma.saleTransactions.findMany({
        where: {
          AND: [
            {
              status: {
                in: [
                  TransactionStatus.PAYMENT_VERIFIED,
                  TransactionStatus.PENDING,
                ],
              },
              formOfPayment: FOP.CRYPTO,
            },
            {
              sale: {
                status: SaleStatus.OPEN,
              },
            },
            {
              createdAt: { lte: sixHoursAgo },
            },
          ],
        },
      });

      if (cryptoTransactions.length > 0) {
        //TODO: Implement this
        // for (const tx of cryptoTransactions) {
        //   // If there we know which blockchain the transaction has been broadcasted, then we can check
        //   if (tx.txHash && isValidChainId(tx.blockchainId)) {
        //     nodeProvider
        //       .getTransaction(tx.blockchainId, tx.txHash)
        //       .then((result) => {
        //         //transaction was confirmed in blockchain
        //         if (result && result.confirmations > 0) {
        //           prisma.saleTransactions.update({
        //             where: {
        //               uuid: tx.uuid,
        //             },
        //             data: {
        //               status: TransactionStatus.PAYMENT_VERIFIED,
        //             },
        //           });
        //         }
        //         // IF null then means transaction is pending, and by previous search, it has been pending for at least 6 hours.
        //         if (result === null) {
        //           cancelTransactionAndRestoreUnits(tx);
        //         }
        //       });
        //   } else {
        //     // If we have a pending crypto transaction without txHash we can assume it was never broadcasted by the user to the blockchain
        //     if (tx.status === TransactionStatus.PENDING) {
        //       cancelTransactionAndRestoreUnits(tx);
        //     }
        //   }
        // }
      }

      return Success({});
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

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

  async getSaleSaftForTransaction(dto: { txId: string }, ctx: ActionCtx) {
    // We need to retrieve the saft content for the sale.
    // We need to replace default variables with the ones from the transaction.
    // We need ot send it to the front end for review with puplated vars
    try {
      const transaction = await prisma.saleTransactions.findUnique({
        where: { id: String(dto.txId) },
        select: {
          sale: {
            select: {
              saftContract: {
                select: {
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

  parseTransactionVariablesToContract({
    tx,
    user,
    profile,
    address,
    sale,
    contract,
    variables,
  }: {
    tx: SaleTransactions;
    sale: Pick<Sale, 'currency' | 'tokenPricePerUnit'>;
    contract: SaftContract['content'];
    variables: SaftContract['variables'];
    user?: Partial<User>;
    profile?: Partial<Profile>;
    address?: Partial<Address>;
  }) {
    const defaultVariables = {
      // profile
      'recipient.firstname': profile?.firstName || null,
      'recipient.lastname': profile?.lastName || null,
      'recipient.email': user?.email || null,
      // address
      'recipient.city': address?.city || null,
      'recipient.zipcode': address?.zipCode || null,
      'recipient.state': address?.state || null,
      'recipient.country': address?.country || null,
      // Purchase
      'token.quantity': tx.quantity.toString() || null,
      'token.symbol': tx.tokenSymbol,
      'paid.currency': tx.paidCurrency || null,
      'paid.amount':
        tx.totalAmount?.toFixed(
          FIAT_CURRENCIES.includes(tx.paidCurrency) ? 4 : 8
        ) || null,
      'sale.currency': sale.currency || null,
      'equivalent.amount':
        new Prisma.Decimal(tx.quantity)
          .mul(sale.tokenPricePerUnit)
          .toFixed(2) || null,
      date: new Date().toISOString().split('T')[0],
    };

    return defaultVariables;
  }
}

const _createSaftContract = ({
  contract,
  userData,
  contractValues,
  saleCurrency,
  saleTokenPricePerUnit,
}: {
  contract: string;
  //TODO! check this was UserWithProfileAndAddress
  userData: any;
  contractValues: {
    currency: Currency;
    amount: string | number;
    quantity: number;
    formOfPayment: FOP;
  };
  saleCurrency: Currency;
  saleTokenPricePerUnit: number;
}) => {
  const profile = userData?.profile;
  const address = profile?.address;

  const precision = contractValues?.formOfPayment === FOP.CRYPTO ? 8 : 2;

  const saleAmount = new Prisma.Decimal(contractValues?.quantity || 0)
    .mul(new Prisma.Decimal(saleTokenPricePerUnit))
    .toFixed(precision);

  // const contractVariables = {
  //   // profile
  //   firstname: profile?.firstName || 'XXXXX',
  //   lastname: profile?.lastName || 'XXXXX',
  //   email: profile?.email || 'XXXXX',
  //   // address
  //   city: address?.city || 'XXXXX',
  //   zipcode: address?.zipCode || 'XXXXX',
  //   state: address?.state || 'XXXXX',
  //   country: address?.country || 'XXXXX',
  //   // Purchase
  //   quantity: contractValues?.quantity || 'XXXXX',
  //   currency: contractValues?.currency || 'XXXXX',
  //   amount:
  //     new Prisma.Decimal(contractValues?.amount || 0)
  //       .toFixed(precision)
  //       .toString() || 'XXXXX',
  //   'sale.currency':  saleCurrency || 'XXXXX',
  //   'equivalent.amount': paidamountindefaultcurrency: saleAmount?.toString() || 'XXXXX',
  //   date: DateTime.now().toFormat('yyyy-MM-dd'),
  // };

  // const template = Handlebars.compile(contract);
  // const fullContract = template(contractVariables);

  // return fullContract;
  return '';
};

export default new TransactionsController();
