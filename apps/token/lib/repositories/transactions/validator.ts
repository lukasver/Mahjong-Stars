import { DateTime } from 'luxon';
import { prisma } from '@/db';
import { HttpError } from '../errors';
import HttpStatusCode from '../httpStatusCodes';
import { checkSaleDateIsNotExpired } from '../sales/functions';
import {
  FOP,
  Sale,
  SaleStatus,
  SaleTransactions,
  TransactionStatus,
  User,
  Blockchain,
  Prisma,
} from '@prisma/client';
import Decimal from 'decimal.js';

const USER_SELECT_QUERY = {
  id: true,
  walletAddress: true,
  email: true,
  profile: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
  emailVerified: true,
  kycVerification: {
    select: {
      id: true,
      status: true,
    },
  },
} as const;

export type UserPayload = Prisma.UserGetPayload<{
  select: typeof USER_SELECT_QUERY;
}>;

/**
 * Validates transaction creation and confirmation requirements
 */
export class TransactionValidator {
  /**
   * Validates all conditions for creating a new transaction in PENDING state
   */
  static async validateTransactionCreation(transactionData: {
    userId: string;
    saleId: string;
    tokenSymbol: string;
    quantity: number;
    formOfPayment: FOP;
    totalAmount: Decimal | string;
    paidCurrency: string;
    receivingWallet?: string;
    comment?: string;
  }): Promise<{
    sale: Sale;
    user: UserPayload;
    pendingTransaction?: SaleTransactions | null;
  }> {
    const { userId, saleId, quantity } = transactionData;

    const user = await this.validateUserExists(userId);

    if (!user) {
      throw new HttpError(HttpStatusCode.NOT_FOUND, 'User not found');
    }

    // Validate required data
    this.validateRequiredData(transactionData);

    // Get and validate sale
    const sale = await this.validateSaleExists(saleId);
    this.validateSaleStatus(sale);
    this.validateSaleAvailability(sale, quantity);
    this.validateSaleDateNotExpired(sale);

    // Validate pending transactions
    const pendingTransaction = await this.validateNoPendingTransactions(
      userId,
      saleId
    );

    // Validate user-specific rules
    // this.validateUserSpecificRules(user, quantity, sale);

    // Validate SAFT contract requirements
    await this.validateSaftContractRequirements(sale, user);

    return {
      sale,
      user,
      pendingTransaction,
    };
  }

  /**
   * Validates all conditions for updating a transaction status
   */
  static async validateTransactionStatusUpdate(
    transactionId: string,
    newStatus: TransactionStatus,
    updateData?: {
      txHash?: string;
      blockchainId?: string;
      comment?: string;
      confirmationId?: string;
      paymentEvidence?: string;
      paymentDate?: Date;
      rejectionReason?: string;
      approvedBy?: string;
    }
  ): Promise<{
    transaction: SaleTransactions & {
      sale: Sale;
      user: User;
      blockchain: Blockchain | null;
      approver: User | null;
    };
  }> {
    // Validate transaction exists and can be updated
    const transaction = await this.validateTransactionExists(transactionId);
    this.validateTransactionStatusTransition(transaction.status, newStatus);
    this.validateTransactionUpdateData(newStatus, updateData);

    // Validate blockchain transaction if applicable
    if (
      newStatus === TransactionStatus.PAYMENT_VERIFIED &&
      updateData?.txHash &&
      updateData?.blockchainId
    ) {
      await this.validateBlockchainTransaction(transaction, {
        txHash: updateData.txHash,
        blockchainId: updateData.blockchainId,
      });
    }

    return { transaction };
  }

  /**
   * Validates sale closing conditions
   */
  static validateSaleClosingConditions(sale: Sale): {
    shouldClose: boolean;
    reason?: string;
  } {
    const now = DateTime.now();
    const closingDate = DateTime.fromJSDate(sale.saleClosingDate);
    const isExpired = closingDate <= now;
    const isSoldOut =
      sale.availableTokenQuantity !== null && sale.availableTokenQuantity <= 0;

    if (isExpired) {
      return { shouldClose: true, reason: 'Sale closing date has passed' };
    }

    if (isSoldOut) {
      return { shouldClose: true, reason: 'All tokens have been sold' };
    }

    return { shouldClose: false };
  }

  /**
   * Validates transaction timeout conditions for cron job processing
   */
  static validateTransactionTimeout(
    transaction: SaleTransactions,
    timeoutHours: number = 6
  ): {
    shouldTimeout: boolean;
    reason?: string;
  } {
    const timeoutDate = DateTime.local().minus({ hours: timeoutHours });
    const transactionDate = DateTime.fromJSDate(transaction.createdAt);
    const isTimedOut = transactionDate <= timeoutDate;

    if (isTimedOut) {
      const reason =
        transaction.formOfPayment === FOP.CRYPTO
          ? 'Crypto transaction pending for too long'
          : 'Non-crypto transaction pending for too long';

      return { shouldTimeout: true, reason };
    }

    return { shouldTimeout: false };
  }

  // Private validation methods

  private static validateRequiredData(transactionData: any): void {
    if (!transactionData.userId || !transactionData.saleId) {
      throw new HttpError(
        HttpStatusCode.BAD_REQUEST,
        'Transaction data missing or incomplete'
      );
    }

    if (!transactionData.quantity || transactionData.quantity <= 0) {
      throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Invalid token quantity');
    }

    if (!transactionData.formOfPayment) {
      throw new HttpError(
        HttpStatusCode.BAD_REQUEST,
        'Form of payment is required'
      );
    }

    if (!transactionData.totalAmount || !transactionData.paidCurrency) {
      throw new HttpError(
        HttpStatusCode.BAD_REQUEST,
        'Payment amount and currency are required'
      );
    }

    if (!transactionData.tokenSymbol) {
      throw new HttpError(
        HttpStatusCode.BAD_REQUEST,
        'Token symbol is required'
      );
    }
  }

  private static async validateSaleExists(saleId: string): Promise<Sale> {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
    });

    if (!sale) {
      throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Sale not found');
    }

    return sale;
  }

  private static validateSaleStatus(sale: Sale): void {
    if (sale.status !== SaleStatus.OPEN) {
      throw new HttpError(
        HttpStatusCode.BAD_REQUEST,
        `Sale is not open for transactions. Current status: ${sale.status}`
      );
    }
  }

  private static validateSaleAvailability(sale: Sale, quantity: number): void {
    if (
      sale.availableTokenQuantity !== null &&
      sale.availableTokenQuantity < quantity
    ) {
      throw new HttpError(
        HttpStatusCode.BAD_REQUEST,
        'Cannot buy more tokens than available amount',
        sale
      );
    }

    // Validate minimum token buy per user
    if (quantity < sale.minimumTokenBuyPerUser) {
      throw new HttpError(
        HttpStatusCode.BAD_REQUEST,
        `Minimum token buy per user is ${sale.minimumTokenBuyPerUser}`
      );
    }

    // Validate maximum token buy per user if set
    if (sale.maximumTokenBuyPerUser && quantity > sale.maximumTokenBuyPerUser) {
      throw new HttpError(
        HttpStatusCode.BAD_REQUEST,
        `Maximum token buy per user is ${sale.maximumTokenBuyPerUser}`
      );
    }
  }

  private static validateSaleDateNotExpired(sale: Sale): void {
    checkSaleDateIsNotExpired(sale);
  }

  private static async validateUserExists(
    userId: string
  ): Promise<UserPayload> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: USER_SELECT_QUERY,
    });

    if (!user) {
      throw new HttpError(HttpStatusCode.BAD_REQUEST, 'User not found');
    }
    return user;
  }

  private static async validateNoPendingTransactions(
    userId: string,
    saleId: string
  ): Promise<SaleTransactions | null> {
    const pendingTransaction = await prisma.saleTransactions.findFirst({
      where: {
        status: TransactionStatus.PENDING,
        saleId,
        userId,
      },
    });

    if (pendingTransaction) {
      throw new HttpError(
        HttpStatusCode.CONFLICT,
        'Cannot create a new transaction if user has a pending one',
        { transaction: pendingTransaction }
      );
    }

    return pendingTransaction;
  }

  // private static validateUserSpecificRules(
  //   user: UserPayload,
  //   quantity: number,
  //   sale: Sale
  // ): void {
  // const isSiwe = currentUser?.isSiwe || userData?.isSiwe;
  // if (isSiwe) {
  // this.validateMaxAllowanceWithoutKYC(quantity);
  // }
  // Validate KYC requirements if sale requires KYC
  // if (sale.requiresKYC) {
  //   this.validateKYCRequirements(userData);
  // }
  // }

  // private static validateMaxAllowanceWithoutKYC(quantity: number): void {
  //   const maxAllowance = MAX_ALLOWANCE_WITHOUT_KYC;

  //   if (quantity > maxAllowance) {
  //     throw new HttpError(
  //       HttpStatusCode.BAD_REQUEST,
  //       `Cannot buy more than ${maxAllowance} tokens without KYC`
  //     );
  //   }
  // }

  // private static validateKYCRequirements(user: UserPayload): void {
  //   return; // NOT ENABLED FOR NOW
  // Check if user has completed KYC verification
  // if (!user.kycVerification || user?.kycVerification?.status !== 'VERIFIED') {
  //   throw new HttpError(
  //     HttpStatusCode.BAD_REQUEST,
  //     'KYC verification is required for this sale'
  //   );
  // }
  // }

  private static async validateSaftContractRequirements(
    sale: Sale,
    userData: UserPayload
  ): Promise<void> {
    if (sale.saftCheckbox) {
      if (!userData?.email) {
        throw new HttpError(
          HttpStatusCode.BAD_REQUEST,
          'User email is required for SAFT contract, please validate your email'
        );
      }
      if (!userData.emailVerified) {
        throw new HttpError(
          HttpStatusCode.BAD_REQUEST,
          'User email is required for SAFT contract, please validate your email'
        );
      }
    }
  }

  private static async validateTransactionExists(
    transactionId: string
  ): Promise<
    SaleTransactions & {
      sale: Sale;
      user: User;
      blockchain: Blockchain | null;
      approver: User | null;
    }
  > {
    const transaction = await prisma.saleTransactions.findUnique({
      where: { id: transactionId },
      include: {
        sale: true,
        user: true,
        blockchain: true,
        approver: true,
      },
    });

    if (!transaction) {
      throw new HttpError(HttpStatusCode.NOT_FOUND, 'Transaction not found');
    }

    return transaction;
  }

  private static validateTransactionStatusTransition(
    currentStatus: TransactionStatus,
    newStatus: TransactionStatus
  ): void {
    const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
      [TransactionStatus.PENDING]: [
        TransactionStatus.AWAITING_PAYMENT,
        TransactionStatus.CANCELLED,
        TransactionStatus.REJECTED,
      ],
      [TransactionStatus.AWAITING_PAYMENT]: [
        TransactionStatus.PAYMENT_SUBMITTED,
        TransactionStatus.CANCELLED,
        TransactionStatus.REJECTED,
      ],
      [TransactionStatus.PAYMENT_SUBMITTED]: [
        TransactionStatus.PAYMENT_VERIFIED,
        TransactionStatus.REJECTED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionStatus.PAYMENT_VERIFIED]: [
        TransactionStatus.REJECTED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionStatus.TOKENS_DISTRIBUTED]: [
        TransactionStatus.COMPLETED,
        TransactionStatus.REJECTED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionStatus.COMPLETED]: [],
      [TransactionStatus.REJECTED]: [],
      [TransactionStatus.CANCELLED]: [],
      [TransactionStatus.REFUNDED]: [],
    };

    const allowedTransitions = validTransitions[currentStatus];

    if (!allowedTransitions.includes(newStatus)) {
      throw new HttpError(
        HttpStatusCode.BAD_REQUEST,
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  private static validateTransactionUpdateData(
    newStatus: TransactionStatus,
    updateData?: any
  ): void {
    // Validate required data for specific status transitions
    if (newStatus === TransactionStatus.PAYMENT_SUBMITTED) {
      if (!updateData?.paymentEvidence) {
        throw new HttpError(
          HttpStatusCode.BAD_REQUEST,
          'Payment evidence is required for PAYMENT_SUBMITTED status'
        );
      }
    }

    if (
      newStatus === TransactionStatus.PAYMENT_VERIFIED &&
      updateData?.txHash
    ) {
      if (!updateData?.blockchainId) {
        throw new HttpError(
          HttpStatusCode.BAD_REQUEST,
          'Blockchain ID is required when providing transaction hash'
        );
      }
    }

    if (newStatus === TransactionStatus.REJECTED) {
      if (!updateData?.rejectionReason) {
        throw new HttpError(
          HttpStatusCode.BAD_REQUEST,
          'Rejection reason is required for REJECTED status'
        );
      }
    }
  }

  private static async validateBlockchainTransaction(
    transaction: SaleTransactions,
    updateData: { txHash: string; blockchainId: string }
  ): Promise<void> {
    // Validate transaction hash format
    if (!updateData.txHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      throw new HttpError(
        HttpStatusCode.BAD_REQUEST,
        'Invalid transaction hash format'
      );
    }

    // Validate blockchain exists and is enabled
    const blockchain = await prisma.blockchain.findUnique({
      where: { id: updateData.blockchainId },
    });

    if (!blockchain) {
      throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Blockchain not found');
    }

    if (!blockchain.isEnabled) {
      throw new HttpError(
        HttpStatusCode.BAD_REQUEST,
        'Blockchain is not enabled'
      );
    }

    // Check for duplicate transaction hash
    const existingTransaction = await prisma.saleTransactions.findFirst({
      where: {
        txHash: updateData.txHash,
        blockchainId: updateData.blockchainId,
        id: { not: transaction.id },
      },
    });

    if (existingTransaction) {
      throw new HttpError(
        HttpStatusCode.CONFLICT,
        'Transaction hash already exists'
      );
    }
  }
}
