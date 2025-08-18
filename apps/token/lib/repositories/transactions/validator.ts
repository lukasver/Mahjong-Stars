import {
  Blockchain,
  FOP,
  Prisma,
  Sale,
  SaleStatus,
  SaleTransactions,
  TransactionStatus,
  User,
} from '@prisma/client';
import Decimal from 'decimal.js';
import { DateTime } from 'luxon';
import { prisma } from '@/db';
import { TransactionValidationError } from '../errors';

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
 * Interface for transaction creation data validation
 */
interface TransactionCreationData {
  userId: string;
  saleId: string;
  tokenSymbol: string;
  quantity: number;
  formOfPayment: FOP;
  totalAmount: Decimal | string;
  paidCurrency: string;
  receivingWallet?: string;
  comment?: string;
}

/**
 * Interface for transaction update data validation
 */
interface TransactionUpdateData {
  txHash?: string;
  blockchainId?: string;
  comment?: string;
  confirmationId?: string;
  paymentEvidence?: string;
  paymentDate?: Date;
  rejectionReason?: string;
  approvedBy?: string;
}

/**
 * Validates transaction creation and confirmation requirements
 */
export class TransactionValidator {
  /**
   * Validates all conditions for creating a new transaction in PENDING state
   */
  static async validateTransactionCreation(
    transactionData: TransactionCreationData
  ): Promise<{
    sale: Sale;
    user: UserPayload;
    pendingTransaction?: SaleTransactions | null;
  }> {
    const { userId, saleId, quantity } = transactionData;

    const user = await this.validateUserExists(userId);

    if (!user) {
      throw new TransactionValidationError('CREATION', 'User not found', {
        field: 'user',
        value: userId,
      });
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

    // Validate KYC requirements if sale requires KYC
    this.validateKYCRequirements(sale, user);

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
    updateData?: TransactionUpdateData
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

  private static validateRequiredData(
    transactionData: TransactionCreationData
  ): void {
    if (!transactionData.userId || !transactionData.saleId) {
      throw new TransactionValidationError(
        'CREATION',
        'Transaction data missing or incomplete',
        {
          field: transactionData.userId ? 'saleId' : 'userId',
          value: transactionData.userId || transactionData.saleId,
        }
      );
    }

    if (!transactionData.quantity || transactionData.quantity <= 0) {
      throw new TransactionValidationError(
        'CREATION',
        'Invalid token quantity',
        {
          field: 'quantity',
          value: transactionData.quantity,
        }
      );
    }

    if (!transactionData.formOfPayment) {
      throw new TransactionValidationError(
        'CREATION',
        'Form of payment is required',
        {
          field: 'formOfPayment',
          value: transactionData.formOfPayment,
        }
      );
    }

    if (!transactionData.totalAmount || !transactionData.paidCurrency) {
      throw new TransactionValidationError(
        'CREATION',
        'Payment amount and currency are required',
        {
          field: transactionData.totalAmount ? 'paidCurrency' : 'totalAmount',
          value: {
            totalAmount: transactionData.totalAmount,
            paidCurrency: transactionData.paidCurrency,
          },
        }
      );
    }

    if (!transactionData.tokenSymbol) {
      throw new TransactionValidationError(
        'CREATION',
        'Token symbol is required',
        {
          field: 'tokenSymbol',
          value: transactionData.tokenSymbol,
        }
      );
    }
  }

  private static async validateSaleExists(saleId: string): Promise<Sale> {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
    });

    if (!sale) {
      throw new TransactionValidationError('CREATION', 'Sale not found', {
        field: 'sale',
        value: saleId,
      });
    }

    return sale;
  }

  private static validateSaleStatus(sale: Sale): void {
    if (sale.status !== SaleStatus.OPEN) {
      throw new TransactionValidationError(
        'CREATION',
        `Sale is not open for transactions. Current status: ${sale.status}`,
        {
          field: 'sale',
          value: sale.id,
          currentStatus: sale.status,
        }
      );
    }
  }

  private static validateSaleAvailability(sale: Sale, quantity: number): void {
    if (
      sale.availableTokenQuantity !== null &&
      sale.availableTokenQuantity < quantity
    ) {
      throw new TransactionValidationError(
        'CREATION',
        'Cannot buy more tokens than available amount',
        {
          field: 'sale',
          value: sale.id,
          requestedQuantity: quantity,
          availableQuantity: sale.availableTokenQuantity,
        }
      );
    }

    // Validate minimum token buy per user
    if (quantity < sale.minimumTokenBuyPerUser) {
      throw new TransactionValidationError(
        'CREATION',
        `Minimum token buy per user is ${sale.minimumTokenBuyPerUser}`,
        {
          field: 'sale',
          value: sale.id,
          requestedQuantity: quantity,
          minimumRequired: sale.minimumTokenBuyPerUser,
        }
      );
    }

    // Validate maximum token buy per user if set
    if (sale.maximumTokenBuyPerUser && quantity > sale.maximumTokenBuyPerUser) {
      throw new TransactionValidationError(
        'CREATION',
        `Maximum token buy per user is ${sale.maximumTokenBuyPerUser}`,
        {
          field: 'sale',
          value: sale.id,
          requestedQuantity: quantity,
          maximumAllowed: sale.maximumTokenBuyPerUser,
        }
      );
    }
  }

  static validateSaleDateNotExpired(sale: Pick<Sale, 'saleClosingDate'>): void {
    if (DateTime.fromJSDate(sale.saleClosingDate) <= DateTime.now()) {
      throw new TransactionValidationError(
        'CREATION',
        `Sale closing date is in the past: ${sale.saleClosingDate}`,
        {
          field: 'sale',
          value: 'unknown',
          saleClosingDate: sale.saleClosingDate,
        }
      );
    }
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
      throw new TransactionValidationError('CREATION', 'User not found', {
        field: 'user',
        value: userId,
      });
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
      throw new TransactionValidationError(
        'CREATION',
        'Cannot create a new transaction if user has a pending one',
        {
          field: 'user',
          value: userId,
          saleId,
          pendingTransactionId: pendingTransaction.id,
          transaction: pendingTransaction,
        }
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

  private static validateKYCRequirements(sale: Sale, user: UserPayload): void {
    // Transaction is allowed to proceed if KYC is not done since user will be prompted to update its documents.
    if (sale.requiresKYC) {
      if (!user.email) {
        throw new TransactionValidationError(
          'CREATION',
          'User email is required for KYC verification',
          {
            field: 'user',
            value: user.id,
            saleId: sale.id,
            requiresKYC: true,
          }
        );
      }
      if (!user.emailVerified) {
        throw new TransactionValidationError(
          'CREATION',
          'User email must be verified for KYC verification',
          {
            field: 'user',
            value: user.id,
            saleId: sale.id,
            requiresKYC: true,
            emailVerified: false,
          }
        );
      }
    }
  }

  private static async validateSaftContractRequirements(
    sale: Sale,
    userData: UserPayload
  ): Promise<void> {
    if (sale.saftCheckbox) {
      if (!userData?.email) {
        throw new TransactionValidationError(
          'CREATION',
          'User email is required for SAFT contract, please validate your email',
          {
            field: 'user',
            value: userData.id,
            saleId: sale.id,
            requiresSaft: true,
          }
        );
      }
      if (!userData.emailVerified) {
        throw new TransactionValidationError(
          'CREATION',
          'User email is required for SAFT contract, please validate your email',
          {
            field: 'user',
            value: userData.id,
            saleId: sale.id,
            requiresSaft: true,
            emailVerified: false,
          }
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
      throw new TransactionValidationError(
        'STATUS_UPDATE',
        'Transaction not found',
        {
          field: 'transaction',
          value: transactionId,
        }
      );
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
      throw new TransactionValidationError(
        'STATUS_UPDATE',
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
        {
          field: 'status',
          value: { from: currentStatus, to: newStatus },
          allowedTransitions,
        }
      );
    }
  }

  private static validateTransactionUpdateData(
    newStatus: TransactionStatus,
    updateData?: TransactionUpdateData
  ): void {
    // Validate required data for specific status transitions
    if (newStatus === TransactionStatus.PAYMENT_SUBMITTED) {
      if (!updateData?.paymentEvidence) {
        throw new TransactionValidationError(
          'STATUS_UPDATE',
          'Payment evidence is required for PAYMENT_SUBMITTED status',
          {
            field: 'paymentEvidence',
            value: updateData?.paymentEvidence,
          }
        );
      }
    }

    if (
      newStatus === TransactionStatus.PAYMENT_VERIFIED &&
      updateData?.txHash
    ) {
      if (!updateData?.blockchainId) {
        throw new TransactionValidationError(
          'STATUS_UPDATE',
          'Blockchain ID is required when providing transaction hash',
          {
            field: 'blockchainId',
            value: updateData?.blockchainId,
          }
        );
      }
    }

    if (newStatus === TransactionStatus.REJECTED) {
      if (!updateData?.rejectionReason) {
        throw new TransactionValidationError(
          'STATUS_UPDATE',
          'Rejection reason is required for REJECTED status',
          {
            field: 'rejectionReason',
            value: updateData?.rejectionReason,
          }
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
      throw new TransactionValidationError(
        'STATUS_UPDATE',
        'Invalid transaction hash format',
        {
          field: 'txHash',
          value: updateData.txHash,
          expectedFormat: '0x followed by 64 hexadecimal characters',
        }
      );
    }

    // Validate blockchain exists and is enabled
    const blockchain = await prisma.blockchain.findUnique({
      where: { id: updateData.blockchainId },
    });

    if (!blockchain) {
      throw new TransactionValidationError(
        'STATUS_UPDATE',
        'Blockchain not found',
        {
          field: 'blockchainId',
          value: updateData.blockchainId,
        }
      );
    }

    if (!blockchain.isEnabled) {
      throw new TransactionValidationError(
        'STATUS_UPDATE',
        'Blockchain is not enabled',
        {
          field: 'blockchainId',
          value: updateData.blockchainId,
          isEnabled: blockchain.isEnabled,
        }
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
      throw new TransactionValidationError(
        'STATUS_UPDATE',
        'Transaction hash already exists',
        {
          field: 'txHash',
          value: updateData.txHash,
          blockchainId: updateData.blockchainId,
          existingTransactionId: existingTransaction.id,
        }
      );
    }
  }
}
