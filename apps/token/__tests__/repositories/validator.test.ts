// biome-ignore-start lint/suspicious/noExplicitAny: test-file

import { faker } from '@faker-js/faker';
import {
  FOP,
  type Sale,
  SaleStatus,
  type SaleTransactions,
  TransactionStatus,
  type User,
} from '@prisma/client';
import Decimal from 'decimal.js';
import { DateTime } from 'luxon';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { prisma as db } from '@/lib/db/prisma';
import { TransactionValidationError } from '@/lib/repositories/errors';
import {
  TransactionValidator,
  type UserPayload,
} from '@/lib/repositories/transactions/validator';
import {
  cleanUpTestContext,
  createScenario,
  mockTransactions,
} from '../mocks/helpers';

vi.mock('server-only', () => ({}));

// Type for mocked user data
// type MockUserPayload = Prisma.UserGetPayload<{
//   select: {
//     id: true;
//     walletAddress: true;
//     email: true;
//     profile: {
//       select: {
//         firstName: true;
//         lastName: true;
//       };
//     };
//     emailVerified: true;
//     kycVerification: {
//       select: {
//         id: true;
//         status: true;
//       };
//     };
//   };
// }>;

// Block all external HTTP requests except localhost
// nock.disableNetConnect();
// nock.enableNetConnect('127.0.0.1');

/**
 * Vitest suite for TransactionValidator
 * Tests all validation methods with proper mocking and error handling
 */
describe('TransactionValidator', () => {
  describe('validateTransactionCreation', () => {
    let adminUser: User;
    let regularUser: User;
    let testSale: Sale;
    // let testBlockchain: Blockchain;
    let testTransaction: SaleTransactions;
    let validTransactionData: SaleTransactions;

    beforeEach(async () => {
      vi.restoreAllMocks();
      // Clean up database before each test
      await cleanUpTestContext(db, {
        transactions: [testTransaction],
        sales: [testSale],
        users: [adminUser, regularUser],
      });

      // Create test users
      const { sale, user, admin, transaction } = await createScenario(db);
      testSale = sale;
      testTransaction = transaction;
      adminUser = admin;
      regularUser = user;

      validTransactionData = mockTransactions({
        userId: regularUser?.id || 'user-id',
        saleId: testSale?.id || 'sale-id',
        quantity: new Decimal(
          faker.number.int({
            min: 1,
            max: testSale?.availableTokenQuantity || 1000,
          })
        ),
        comment: 'Test transaction',
      });
    });

    afterEach(async () => {
      vi.restoreAllMocks();
      await cleanUpTestContext(db, {
        transactions: [testTransaction],
        sales: [testSale],
        users: [adminUser, regularUser],
      });
    });

    function getValidTransactionData(validTransactionData: SaleTransactions) {
      return {
        ...validTransactionData,
        quantity: validTransactionData.quantity.toNumber(),
        receivingWallet: validTransactionData.receivingWallet || undefined,
        comment: validTransactionData.comment || undefined,
      };
    }

    test('should validate transaction creation successfully', async () => {
      // Mock the database calls
      const mockUser: UserPayload = {
        id: regularUser.id,
        walletAddress: regularUser.walletAddress,
        email: regularUser.email,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        emailVerified: true,
        kycVerification: null,
      };

      const mockSale: Sale = {
        ...testSale,
        status: SaleStatus.OPEN,
        saftCheckbox: false,
      };

      vi.spyOn(db.user, 'findUnique').mockResolvedValue(mockUser as any);
      vi.spyOn(db.sale, 'findUnique').mockResolvedValue(mockSale);
      vi.spyOn(db.saleTransactions, 'findFirst').mockResolvedValue(null);

      const result = await TransactionValidator.validateTransactionCreation(
        getValidTransactionData(validTransactionData)
      );

      expect(result.sale).toEqual(mockSale);
      expect(result.user).toEqual(mockUser);
      expect(result.pendingTransaction).toBeNull();
    });

    test('should throw error when user not found', async () => {
      vi.spyOn(db.user, 'findUnique').mockResolvedValue(null);

      await expect(
        TransactionValidator.validateTransactionCreation(
          getValidTransactionData(validTransactionData)
        )
      ).rejects.toThrow(TransactionValidationError);
    });

    test('should throw error when sale not found', async () => {
      const mockUser: UserPayload = {
        id: regularUser.id,
        walletAddress: regularUser.walletAddress,
        email: regularUser.email,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        emailVerified: true,
        kycVerification: null,
      };

      vi.spyOn(db.user, 'findUnique').mockResolvedValue(mockUser as any);
      vi.spyOn(db.sale, 'findUnique').mockResolvedValue(null);

      await expect(
        TransactionValidator.validateTransactionCreation(
          getValidTransactionData({
            ...validTransactionData,
            saleId: 'non-existing-sale-id',
          })
        )
      ).rejects.toThrow(TransactionValidationError);
    });

    test('should throw error when sale is not open', async () => {
      const mockUser: UserPayload = {
        id: regularUser.id,
        walletAddress: regularUser.walletAddress,
        email: regularUser.email,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        emailVerified: true,
        kycVerification: null,
      };

      const mockSale: Sale = {
        ...testSale,
        status: faker.helpers.arrayElement([
          SaleStatus.CLOSED,
          SaleStatus.FINISHED,
          SaleStatus.CREATED,
        ]),
      };

      vi.spyOn(db.user, 'findUnique').mockResolvedValue(mockUser as any);
      vi.spyOn(db.sale, 'findUnique').mockResolvedValue(mockSale);

      await expect(
        TransactionValidator.validateTransactionCreation(
          getValidTransactionData({
            ...validTransactionData,
            userId: regularUser.id,
            saleId: testSale.id,
          })
        )
      ).rejects.toThrow(TransactionValidationError);
    });

    test('should throw error when insufficient tokens available', async () => {
      const mockUser: UserPayload = {
        id: regularUser.id,
        walletAddress: regularUser.walletAddress,
        email: regularUser.email,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        emailVerified: true,
        kycVerification: null,
      };

      const mockSale: Sale = {
        ...testSale,
        status: SaleStatus.OPEN,
        availableTokenQuantity: 1, // Less than requested quantity
      };

      vi.spyOn(db.user, 'findUnique').mockResolvedValue(mockUser as any);
      vi.spyOn(db.sale, 'findUnique').mockResolvedValue(mockSale);
      vi.spyOn(db.saleTransactions, 'findFirst').mockResolvedValue(null);

      await expect(
        TransactionValidator.validateTransactionCreation(
          getValidTransactionData({
            ...validTransactionData,
            quantity: new Decimal(1.000001), // More than available
          })
        )
      ).rejects.toThrow(TransactionValidationError);
    });

    test('should throw error when quantity below minimum', async () => {
      const mockUser: UserPayload = {
        id: regularUser.id,
        walletAddress: regularUser.walletAddress,
        email: regularUser.email,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        emailVerified: true,
        kycVerification: null,
      };

      const mockSale: Sale = {
        ...testSale,
        status: SaleStatus.OPEN,
        availableTokenQuantity: 1000,
        minimumTokenBuyPerUser: 50,
      };

      vi.spyOn(db.user, 'findUnique').mockResolvedValue(mockUser as any);
      vi.spyOn(db.sale, 'findUnique').mockResolvedValue(mockSale);
      vi.spyOn(db.saleTransactions, 'findFirst').mockResolvedValue(null);

      await expect(
        TransactionValidator.validateTransactionCreation(
          getValidTransactionData({
            ...validTransactionData,
            quantity: new Decimal(10), // Below minimum
          })
        )
      ).rejects.toThrow(TransactionValidationError);
    });

    test('should throw error when quantity above maximum', async () => {
      const mockUser: UserPayload = {
        id: regularUser.id,
        walletAddress: regularUser.walletAddress,
        email: regularUser.email,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        emailVerified: true,
        kycVerification: null,
      };

      const mockSale: Sale = {
        ...testSale,
        status: SaleStatus.OPEN,
        availableTokenQuantity: 1000,
        minimumTokenBuyPerUser: 10,
        maximumTokenBuyPerUser: 100,
      };

      vi.spyOn(db.user, 'findUnique').mockResolvedValue(mockUser as any);
      vi.spyOn(db.sale, 'findUnique').mockResolvedValue(mockSale);
      vi.spyOn(db.saleTransactions, 'findFirst').mockResolvedValue(null);

      await expect(
        TransactionValidator.validateTransactionCreation(
          getValidTransactionData({
            ...validTransactionData,
            quantity: new Decimal(200), // Above maximum
          })
        )
      ).rejects.toThrow(TransactionValidationError);
    });

    test('should throw error when sale closing date has passed', async () => {
      const mockUser: UserPayload = {
        id: regularUser.id,
        walletAddress: regularUser.walletAddress,
        email: regularUser.email,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        emailVerified: true,
        kycVerification: null,
      };

      const mockSale: Sale = {
        ...testSale,
        status: SaleStatus.OPEN,
        availableTokenQuantity: 1000,
        minimumTokenBuyPerUser: 10,
        maximumTokenBuyPerUser: 1000,
        saleClosingDate: DateTime.now().minus({ days: 1 }).toJSDate(), // Past date
      };

      vi.spyOn(db.user, 'findUnique').mockResolvedValue(mockUser as any);
      vi.spyOn(db.sale, 'findUnique').mockResolvedValue(mockSale);
      vi.spyOn(db.saleTransactions, 'findFirst').mockResolvedValue(null);

      await expect(
        TransactionValidator.validateTransactionCreation(
          getValidTransactionData({
            ...validTransactionData,
            quantity: new Decimal(100), // Above maximum
          })
        )
      ).rejects.toThrow(TransactionValidationError);
    });

    test('should throw error when user has pending transaction', async () => {
      const mockUser: UserPayload = {
        id: regularUser.id,
        walletAddress: regularUser.walletAddress,
        email: regularUser.email,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        emailVerified: true,
        kycVerification: null,
      };

      const mockSale: Sale = {
        ...testSale,
        status: SaleStatus.OPEN,
        availableTokenQuantity: 1000,
        minimumTokenBuyPerUser: 10,
        maximumTokenBuyPerUser: 1000,
      };

      const pendingTransaction = mockTransactions({
        status: faker.helpers.arrayElement([
          TransactionStatus.PENDING,
          TransactionStatus.AWAITING_PAYMENT,
        ]),
      });

      vi.spyOn(db.user, 'findUnique').mockResolvedValue(mockUser as any);
      vi.spyOn(db.sale, 'findUnique').mockResolvedValue(mockSale);
      vi.spyOn(db.saleTransactions, 'findFirst').mockResolvedValue(
        pendingTransaction
      );

      await expect(
        TransactionValidator.validateTransactionCreation(
          getValidTransactionData({
            ...validTransactionData,
            userId: regularUser.id,
            saleId: testSale.id,
          })
        )
      ).rejects.toThrow(TransactionValidationError);
    });

    test('should throw error when SAFT contract requires email but user has no email', async () => {
      const mockUser: UserPayload = {
        id: regularUser.id,
        walletAddress: regularUser.walletAddress,
        // @ts-expect-error test case
        email: null,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        emailVerified: false,
        kycVerification: null,
      };

      const mockSale: Sale = {
        ...testSale,
        status: SaleStatus.OPEN,
        availableTokenQuantity: 1000,
        minimumTokenBuyPerUser: 10,
        maximumTokenBuyPerUser: 1000,
        saftCheckbox: true, // Requires email
      };

      vi.spyOn(db.user, 'findUnique').mockResolvedValue(mockUser as any);
      vi.spyOn(db.sale, 'findUnique').mockResolvedValue(mockSale);
      vi.spyOn(db.saleTransactions, 'findFirst').mockResolvedValue(null);

      await expect(
        TransactionValidator.validateTransactionCreation(
          getValidTransactionData({
            ...validTransactionData,
            userId: regularUser.id,
            saleId: testSale.id,
          })
        )
      ).rejects.toThrow(TransactionValidationError);
    });

    test('should throw error when SAFT contract requires verified email but email not verified', async () => {
      const mockUser: UserPayload = {
        id: regularUser.id,
        walletAddress: regularUser.walletAddress,
        email: 'test@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        emailVerified: false, // Not verified
        kycVerification: null,
      };

      const mockSale: Sale = {
        ...testSale,
        status: SaleStatus.OPEN,
        availableTokenQuantity: 1000,
        minimumTokenBuyPerUser: 10,
        maximumTokenBuyPerUser: 1000,
        saftCheckbox: true, // Requires verified email
      };

      vi.spyOn(db.user, 'findUnique').mockResolvedValue(mockUser as any);
      vi.spyOn(db.sale, 'findUnique').mockResolvedValue(mockSale);
      vi.spyOn(db.saleTransactions, 'findFirst').mockResolvedValue(null);

      await expect(
        TransactionValidator.validateTransactionCreation(
          getValidTransactionData({
            ...validTransactionData,
            userId: regularUser.id,
            saleId: testSale.id,
          })
        )
      ).rejects.toThrow(TransactionValidationError);
    });

    test('should throw error when sale requires KYC but user has no email', async () => {
      const mockUser: UserPayload = {
        id: regularUser.id,
        walletAddress: regularUser.walletAddress,
        email: '', // No email
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        emailVerified: false,
        kycVerification: null,
      };

      const mockSale: Sale = {
        ...testSale,
        status: SaleStatus.OPEN,
        availableTokenQuantity: 1000,
        minimumTokenBuyPerUser: 10,
        maximumTokenBuyPerUser: 1000,
        requiresKYC: true, // Requires KYC verification
      };

      vi.spyOn(db.user, 'findUnique').mockResolvedValue(mockUser as any);
      vi.spyOn(db.sale, 'findUnique').mockResolvedValue(mockSale);
      vi.spyOn(db.saleTransactions, 'findFirst').mockResolvedValue(null);

      await expect(
        TransactionValidator.validateTransactionCreation(
          getValidTransactionData({
            ...validTransactionData,
            userId: regularUser.id,
            saleId: testSale.id,
          })
        )
      ).rejects.toThrow(TransactionValidationError);
    });

    test('should throw error when sale requires KYC but user email is not verified', async () => {
      const mockUser: UserPayload = {
        id: regularUser.id,
        walletAddress: regularUser.walletAddress,
        email: 'test@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        emailVerified: false, // Email not verified
        kycVerification: null,
      };

      const mockSale: Sale = {
        ...testSale,
        status: SaleStatus.OPEN,
        availableTokenQuantity: 1000,
        minimumTokenBuyPerUser: 10,
        maximumTokenBuyPerUser: 1000,
        requiresKYC: true, // Requires KYC verification
      };

      vi.spyOn(db.user, 'findUnique').mockResolvedValue(mockUser as any);
      vi.spyOn(db.sale, 'findUnique').mockResolvedValue(mockSale);
      vi.spyOn(db.saleTransactions, 'findFirst').mockResolvedValue(null);

      await expect(
        TransactionValidator.validateTransactionCreation(
          getValidTransactionData({
            ...validTransactionData,
            userId: regularUser.id,
            saleId: testSale.id,
          })
        )
      ).rejects.toThrow(TransactionValidationError);
    });

    test('should allow transaction when sale requires KYC and user has verified email', async () => {
      const mockUser: UserPayload = {
        id: regularUser.id,
        walletAddress: regularUser.walletAddress,
        email: 'test@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        emailVerified: true, // Email verified
        kycVerification: null,
      };

      const mockSale: Sale = {
        ...testSale,
        status: SaleStatus.OPEN,
        requiresKYC: true, // Requires KYC verification
      };

      vi.spyOn(db.user, 'findUnique').mockResolvedValue(mockUser as any);
      vi.spyOn(db.sale, 'findUnique').mockResolvedValue(mockSale);
      vi.spyOn(db.saleTransactions, 'findFirst').mockResolvedValue(null);

      const result = await TransactionValidator.validateTransactionCreation(
        getValidTransactionData({
          ...validTransactionData,
          userId: regularUser.id,
          saleId: testSale.id,
        })
      );

      expect(result.sale).toEqual(mockSale);
      expect(result.user).toEqual(mockUser);
      expect(result.pendingTransaction).toBeNull();
    });

    test('should validate required data fields', async () => {
      vi.spyOn(db.user, 'findUnique').mockResolvedValue(
        faker.helpers.arrayElement([regularUser, null])
      );
      vi.spyOn(db.sale, 'findUnique').mockResolvedValue(testSale);
      const invalidData = {
        userId: '',
        saleId: '',
        tokenSymbol: '',
        quantity: 0,
        formOfPayment: null as any,
        totalAmount: null as any,
        paidCurrency: '',
      };

      await expect(
        TransactionValidator.validateTransactionCreation(invalidData as any)
      ).rejects.toThrow(TransactionValidationError);
    });
  });

  describe('validateTransactionStatusUpdate', () => {
    let adminUser: User;
    let regularUser: User;
    let testSale: Sale;
    // let testBlockchain: Blockchain;
    let testTransaction: SaleTransactions;

    beforeEach(async () => {
      vi.restoreAllMocks();

      // Clean up database before each test
      await cleanUpTestContext(db, {
        transactions: [testTransaction],
        sales: [testSale],
        users: [adminUser, regularUser],
      });

      // Create test users
      const { sale, user, admin, transaction } = await createScenario(db);
      testSale = sale;
      testTransaction = transaction;
      adminUser = admin;
      regularUser = user;
    });

    afterEach(async () => {
      vi.restoreAllMocks();
      await cleanUpTestContext(db, {
        transactions: [testTransaction],
        sales: [testSale],
        users: [adminUser, regularUser],
      });
    });

    test('should validate status update successfully', async () => {
      const mockTx = {
        ...testTransaction,
        status: TransactionStatus.PENDING,
      };
      vi.spyOn(db.saleTransactions, 'findUnique').mockResolvedValue({
        ...mockTx,
      } as any);

      const result = await TransactionValidator.validateTransactionStatusUpdate(
        testTransaction.id,
        TransactionStatus.AWAITING_PAYMENT
      );

      expect(result.transaction).toEqual(mockTx);
    });

    test('should throw error when transaction not found', async () => {
      vi.spyOn(db.saleTransactions, 'findUnique').mockResolvedValue(null);

      await expect(
        TransactionValidator.validateTransactionStatusUpdate(
          'tx-1',
          TransactionStatus.AWAITING_PAYMENT
        )
      ).rejects.toThrow(TransactionValidationError);
    });

    test('should throw error for invalid status transition', async () => {
      vi.spyOn(db.saleTransactions, 'findUnique').mockResolvedValue(
        testTransaction as any
      );

      await expect(
        TransactionValidator.validateTransactionStatusUpdate(
          testTransaction.id,
          TransactionStatus.COMPLETED // Invalid transition from PENDING
        )
      ).rejects.toThrow(TransactionValidationError);
    });

    test('should require payment evidence for PAYMENT_SUBMITTED status', async () => {
      vi.spyOn(db.saleTransactions, 'findUnique').mockResolvedValue(
        testTransaction as any
      );

      await expect(
        TransactionValidator.validateTransactionStatusUpdate(
          testTransaction.id,
          TransactionStatus.PAYMENT_SUBMITTED,
          {} // No payment evidence
        )
      ).rejects.toThrow(TransactionValidationError);
    });

    test('should require rejection reason for REJECTED status', async () => {
      vi.spyOn(db.saleTransactions, 'findUnique').mockResolvedValue(
        testTransaction as any
      );

      await expect(
        TransactionValidator.validateTransactionStatusUpdate(
          testTransaction.id,
          TransactionStatus.REJECTED,
          {} // No rejection reason
        )
      ).rejects.toThrow(TransactionValidationError);
    });

    // test('should validate blockchain transaction when txHash provided', async () => {
    //   const transactionWithHash = {
    //     ...mockTransaction,
    //     status: TransactionStatus.PAYMENT_SUBMITTED,
    //   };

    //   vi.spyOn(db.saleTransactions, 'findUnique').mockResolvedValue(
    //     transactionWithHash as any
    //   );
    //   vi.spyOn(db.blockchain, 'findUnique').mockResolvedValue(testBlockchain);
    //   vi.spyOn(db.saleTransactions, 'findFirst').mockResolvedValue(null);

    //   const result = await TransactionValidator.validateTransactionStatusUpdate(
    //     'tx-1',
    //     TransactionStatus.PAYMENT_VERIFIED,
    //     {
    //       txHash:
    //         '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    //       blockchainId: testBlockchain.id,
    //     }
    //   );

    //   expect(result.transaction).toEqual(transactionWithHash);
    // });

    // test('should throw error for invalid transaction hash format', async () => {
    //   const transactionWithHash = {
    //     ...mockTransaction,
    //     status: TransactionStatus.PAYMENT_SUBMITTED,
    //   };

    //   vi.spyOn(db.saleTransactions, 'findUnique').mockResolvedValue(
    //     transactionWithHash as any
    //   );

    //   await expect(
    //     TransactionValidator.validateTransactionStatusUpdate(
    //       'tx-1',
    //       TransactionStatus.PAYMENT_VERIFIED,
    //       {
    //         txHash: 'invalid-hash',
    //         blockchainId: testBlockchain.id,
    //       }
    //     )
    //   ).rejects.toThrow(TransactionValidationError);
    // });

    // test('should throw error when blockchain not found', async () => {
    //   const transactionWithHash = {
    //     ...mockTransaction,
    //     status: TransactionStatus.PAYMENT_SUBMITTED,
    //   };

    //   vi.spyOn(db.saleTransactions, 'findUnique').mockResolvedValue(
    //     transactionWithHash as any
    //   );
    //   vi.spyOn(db.blockchain, 'findUnique').mockResolvedValue(null);

    //   await expect(
    //     TransactionValidator.validateTransactionStatusUpdate(
    //       'tx-1',
    //       TransactionStatus.PAYMENT_VERIFIED,
    //       {
    //         txHash:
    //           '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    //         blockchainId: 'non-existent-blockchain',
    //       }
    //     )
    //   ).rejects.toThrow(TransactionValidationError);
    // });

    // test('should throw error when blockchain is disabled', async () => {
    //   const transactionWithHash = {
    //     ...mockTransaction,
    //     status: TransactionStatus.PAYMENT_SUBMITTED,
    //   };

    //   const disabledBlockchain = {
    //     ...testBlockchain,
    //     isEnabled: false,
    //   };

    //   vi.spyOn(db.saleTransactions, 'findUnique').mockResolvedValue(
    //     transactionWithHash as any
    //   );
    //   vi.spyOn(db.blockchain, 'findUnique').mockResolvedValue(
    //     disabledBlockchain
    //   );

    //   await expect(
    //     TransactionValidator.validateTransactionStatusUpdate(
    //       'tx-1',
    //       TransactionStatus.PAYMENT_VERIFIED,
    //       {
    //         txHash:
    //           '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    //         blockchainId: testBlockchain.id,
    //       }
    //     )
    //   ).rejects.toThrow(TransactionValidationError);
    // });

    // test('should throw error for duplicate transaction hash', async () => {
    //   const transactionWithHash = {
    //     ...mockTransaction,
    //     status: TransactionStatus.PAYMENT_SUBMITTED,
    //   };

    //   const existingTransaction = mockTransactions({
    //     id: 'existing-tx',
    //     txHash:
    //       '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    //   });

    //   vi.spyOn(db.saleTransactions, 'findUnique').mockResolvedValue(
    //     transactionWithHash as any
    //   );
    //   vi.spyOn(db.blockchain, 'findUnique').mockResolvedValue(testBlockchain);
    //   vi.spyOn(db.saleTransactions, 'findFirst').mockResolvedValue(
    //     existingTransaction
    //   );

    //   await expect(
    //     TransactionValidator.validateTransactionStatusUpdate(
    //       'tx-1',
    //       TransactionStatus.PAYMENT_VERIFIED,
    //       {
    //         txHash:
    //           '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    //         blockchainId: testBlockchain.id,
    //       }
    //     )
    //   ).rejects.toThrow(TransactionValidationError);
    // });
  });

  describe('validateSaleClosingConditions', () => {
    test('should return shouldClose true when sale is expired', () => {
      const expiredSale: Pick<
        Sale,
        'saleClosingDate' | 'availableTokenQuantity'
      > = {
        saleClosingDate: DateTime.now().minus({ days: 1 }).toJSDate(),
        availableTokenQuantity: 100,
      };

      const result = TransactionValidator.validateSaleClosingConditions(
        expiredSale as Sale
      );

      expect(result.shouldClose).toBe(true);
      expect(result.reason).toBe('Sale closing date has passed');
    });

    test('should return shouldClose true when sale is sold out', () => {
      const soldOutSale: Pick<
        Sale,
        'saleClosingDate' | 'availableTokenQuantity'
      > = {
        saleClosingDate: DateTime.now().plus({ days: 1 }).toJSDate(),
        availableTokenQuantity: 0,
      };

      const result = TransactionValidator.validateSaleClosingConditions(
        soldOutSale as Sale
      );

      expect(result.shouldClose).toBe(true);
      expect(result.reason).toBe('All tokens have been sold');
    });

    test('should return shouldClose false when sale is active', () => {
      const activeSale: Pick<
        Sale,
        'saleClosingDate' | 'availableTokenQuantity'
      > = {
        saleClosingDate: DateTime.now().plus({ days: 1 }).toJSDate(),
        availableTokenQuantity: 100,
      };

      const result = TransactionValidator.validateSaleClosingConditions(
        activeSale as Sale
      );

      expect(result.shouldClose).toBe(false);
      expect(result.reason).toBeUndefined();
    });

    test('should return shouldClose false when availableTokenQuantity is null', () => {
      const unlimitedSale: Pick<
        Sale,
        'saleClosingDate' | 'availableTokenQuantity'
      > = {
        saleClosingDate: DateTime.now().plus({ days: 1 }).toJSDate(),
        availableTokenQuantity: 999999, // Large number to simulate unlimited
      };

      const result = TransactionValidator.validateSaleClosingConditions(
        unlimitedSale as Sale
      );

      expect(result.shouldClose).toBe(false);
      expect(result.reason).toBeUndefined();
    });
  });

  describe('validateTransactionTimeout', () => {
    test('should return shouldTimeout true for old crypto transaction', () => {
      const oldTransaction = mockTransactions({
        createdAt: DateTime.now().minus({ hours: 7 }).toJSDate(),
        formOfPayment: FOP.CRYPTO,
      });

      const result = TransactionValidator.validateTransactionTimeout(
        oldTransaction,
        6
      );

      expect(result.shouldTimeout).toBe(true);
      expect(result.reason).toBe('Crypto transaction pending for too long');
    });

    test('should return shouldTimeout true for old non-crypto transaction', () => {
      const oldTransaction = mockTransactions({
        createdAt: DateTime.now().minus({ hours: 7 }).toJSDate(),
        formOfPayment: FOP.TRANSFER,
      });

      const result = TransactionValidator.validateTransactionTimeout(
        oldTransaction,
        6
      );

      expect(result.shouldTimeout).toBe(true);
      expect(result.reason).toBe('Non-crypto transaction pending for too long');
    });

    test('should return shouldTimeout false for recent transaction', () => {
      const recentTransaction = mockTransactions({
        createdAt: DateTime.now().minus({ hours: 2 }).toJSDate(),
        formOfPayment: FOP.CRYPTO,
      });

      const result = TransactionValidator.validateTransactionTimeout(
        recentTransaction,
        6
      );

      expect(result.shouldTimeout).toBe(false);
      expect(result.reason).toBeUndefined();
    });

    test('should use default timeout of 6 hours', () => {
      const oldTransaction = mockTransactions({
        createdAt: DateTime.now().minus({ hours: 7 }).toJSDate(),
        formOfPayment: FOP.CRYPTO,
      });

      const result =
        TransactionValidator.validateTransactionTimeout(oldTransaction);

      expect(result.shouldTimeout).toBe(true);
    });

    test('should respect custom timeout hours', () => {
      const transaction = mockTransactions({
        createdAt: DateTime.now().minus({ hours: 3 }).toJSDate(),
        formOfPayment: FOP.CRYPTO,
      });

      const result = TransactionValidator.validateTransactionTimeout(
        transaction,
        2
      );

      expect(result.shouldTimeout).toBe(true);
    });
  });

  describe('validateSaleDateNotExpired', () => {
    test('should not throw error for future closing date', () => {
      const futureSale: Pick<Sale, 'saleClosingDate'> = {
        saleClosingDate: DateTime.now().plus({ days: 1 }).toJSDate(),
      };

      expect(() => {
        TransactionValidator.validateSaleDateNotExpired(futureSale as Sale);
      }).not.toThrow();
    });

    test('should throw error for past closing date', () => {
      const pastSale: Pick<Sale, 'saleClosingDate'> = {
        saleClosingDate: DateTime.now().minus({ days: 1 }).toJSDate(),
      };

      expect(() => {
        TransactionValidator.validateSaleDateNotExpired(pastSale as Sale);
      }).toThrow(TransactionValidationError);
    });

    test('should throw error for current closing date', () => {
      const currentSale: Pick<Sale, 'saleClosingDate'> = {
        saleClosingDate: DateTime.now().toJSDate(),
      };

      expect(() => {
        TransactionValidator.validateSaleDateNotExpired(currentSale as Sale);
      }).toThrow(TransactionValidationError);
    });
  });
});
// biome-ignore-end lint/suspicious/noExplicitAny: test-file
