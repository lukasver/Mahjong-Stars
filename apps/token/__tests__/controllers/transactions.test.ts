import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import nock from 'nock';
import * as db from '@/lib/db/prisma';
import { Prisma, SaleTransactions, Sale, SaftContract } from '@prisma/client';
import TransactionsController from '@/lib/controllers/transactions';
import { mockTransactions, mockUsers } from '../mocks/helpers';
const Decimal = Prisma.Decimal;

vi.mock('server-only', () => ({}));

// Block all external HTTP requests except localhost
nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

function createCtx(overrides = {}) {
  return {
    isAdmin: true,
    userId: 'user-1',
    address: '0xabc',
    ...overrides,
  };
}

/**
 * Vitest suite for TransactionsController
 * Mocks prisma, logger, and blocks HTTP. Uses vi for stubs.
 */
describe('TransactionsController', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    nock.cleanAll();
  });

  describe('getAllTransactions', () => {
    it('returns all transactions for admin', async () => {
      const fakeTransactions: SaleTransactions[] = [
        mockTransactions(),
        mockTransactions(),
      ];
      vi.spyOn(db.prisma.saleTransactions, 'findMany').mockResolvedValue(
        fakeTransactions
      );
      const ctx = createCtx({ isAdmin: true });
      const result = await TransactionsController.getAllTransactions({}, ctx);
      if (result.success) {
        expect(result.data.transactions).toEqual(fakeTransactions);
        expect(result.data.quantity).toBe(2);
      } else {
        throw new Error('Expected success but got failure');
      }
    });

    it('returns failure if not admin', async () => {
      const ctx = createCtx({ isAdmin: false });
      const result = await TransactionsController.getAllTransactions({}, ctx);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('createTransaction', () => {
    it('creates a transaction successfully', async () => {
      // Use a minimal Sale shape for the test
      const sale: Partial<Sale> = {
        id: 'sale-1',
        status: 'OPEN',
        availableTokenQuantity: 100, // Sale expects number, not Decimal
        requiresKYC: false,
        saftCheckbox: false,
        tokenPricePerUnit: new Prisma.Decimal(1),
        currency: 'USD',
      };
      const transaction: SaleTransactions = mockTransactions({
        id: 'tx-1',
        quantity: new Prisma.Decimal(10),
      });
      vi.spyOn(db.prisma.sale, 'findUnique').mockResolvedValue(sale as Sale);
      vi.spyOn(db.prisma.saleTransactions, 'findFirst').mockResolvedValue(null);
      vi.spyOn(db.prisma, '$transaction').mockImplementation(async (fn) =>
        fn(db.prisma)
      );
      vi.spyOn(db.prisma.sale, 'update').mockResolvedValue(sale as Sale);
      vi.spyOn(db.prisma.saleTransactions, 'create').mockResolvedValue(
        transaction
      );

      const ctx = createCtx();
      const dto = {
        tokenSymbol: 'TKN',
        quantity: new Prisma.Decimal(10),
        formOfPayment: 'TRANSFER' as const,
        receivingWallet: null,
        saleId: 'sale-1',
        comment: null,
        amountPaid: '10',
        paidCurrency: 'USD',
      };
      const result = await TransactionsController.createTransaction(dto, ctx);
      if (result.success) {
        expect(result.data.transaction).toBeDefined();
      } else {
        throw new Error('Expected success but got failure');
      }
    });

    it('returns failure if sale not found', async () => {
      vi.spyOn(db.prisma.sale, 'findUnique').mockResolvedValue(null);
      const ctx = createCtx();
      const dto = {
        tokenSymbol: 'TKN',
        quantity: new Prisma.Decimal(10),
        formOfPayment: 'TRANSFER' as const,
        receivingWallet: null,
        saleId: 'sale-1',
        comment: null,
        amountPaid: '10',
        paidCurrency: 'USD',
      };
      const result = await TransactionsController.createTransaction(dto, ctx);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  /**
   * Test for parseTransactionVariablesToContract
   * Ensures all variables are replaced and returned correctly.
   */
  describe('parseTransactionVariablesToContract', () => {
    it('should populate all contract variables correctly', () => {
      // Arrange: create mocks for tx, sale, user, profile, address
      const tx = mockTransactions({
        quantity: new Prisma.Decimal(42),
        tokenSymbol: 'TKN',
        paidCurrency: 'USD',
        totalAmount: new Prisma.Decimal(1234.5678),
      });
      const user = mockUsers({ email: 'test@example.com' });
      // @ts-expect-error: mockUsers returns a shape with profile
      const profile = user.profile;
      const address = {
        city: 'TestCity',
        zipCode: '12345',
        state: 'TestState',
        country: 'TestCountry',
      };
      const sale = {
        tokenPricePerUnit: new Prisma.Decimal(10),
        currency: 'USD',
      };
      // All variables as used in the controller
      const contractTemplate = `
        <div>
          <span>{{recipient.firstName}}</span>
          <span>{{recipient.lastName}}</span>
          <span>{{recipient.email}}</span>
          <span>{{recipient.city}}</span>
          <span>{{recipient.zipcode}}</span>
          <span>{{recipient.state}}</span>
          <span>{{recipient.country}}</span>
          <span>{{token.quantity}}</span>
          <span>{{token.symbol}}</span>
          <span>{{paid.currency}}</span>
          <span>{{paid.amount}}</span>
          <span>{{sale.currency}}</span>
          <span>{{sale.equivalentAmount}}</span>
          <span>{{date}}</span>
        </div>
      `;
      // The controller expects variables to be of type SaftContract["variables"], but does not use it. Pass as empty object with test-only workaround.
      const variables = {} as SaftContract['variables'];
      // Act
      const { contract, variables: resultVars } =
        TransactionsController.parseTransactionVariablesToContract({
          tx,
          user,
          profile,
          address,
          sale,
          contract: contractTemplate,
          variables,
          inputVariables: {},
        });

      // Assert: all variables are replaced in the contract
      expect(contract).not.toContain('{{');
      expect(contract).toContain(profile.firstName);
      expect(contract).toContain(profile.lastName);
      expect(contract).toContain(user.email);
      expect(contract).toContain(address.city);
      expect(contract).toContain(address.zipCode);
      expect(contract).toContain(address.state);
      expect(contract).toContain(address.country);
      expect(contract).toContain(tx.quantity.toString());
      expect(contract).toContain(tx.tokenSymbol);
      expect(contract).toContain(tx.paidCurrency);
      expect(contract).toContain(resultVars.paid.amount);
      expect(contract).toContain(sale.currency);
      expect(contract).toContain(resultVars.sale.equivalentAmount);
      expect(contract).toContain(resultVars['date']);
      // Assert: variables object contains all expected keys
      expect(resultVars.recipient.firstName).toBe(profile.firstName);
      expect(resultVars.recipient.lastName).toBe(profile.lastName);
      expect(resultVars.recipient.email).toBe(user.email);
      expect(resultVars.recipient.city).toBe(address.city);
      expect(resultVars.recipient.zipcode).toBe(address.zipCode);
      expect(resultVars.recipient.state).toBe(address.state);
      expect(resultVars.recipient.country).toBe(address.country);
      expect(resultVars.token.quantity).toBe(tx.quantity.toString());
      expect(resultVars.token.symbol).toBe(tx.tokenSymbol);
      expect(resultVars.paid.currency).toBe(tx.paidCurrency);
      expect(resultVars.sale.currency).toBe(sale.currency);
      expect(resultVars.sale.equivalentAmount).toBe(
        new Decimal(tx.quantity).mul(sale.tokenPricePerUnit).toFixed(2)
      );
      expect(resultVars['date']).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('computeMissingVariables', () => {
    it('should return missing variables correctly', () => {
      // Only these variables are required (in the variables array)

      const toBeMissing = [
        'recipient.city',
        'recipient.zipcode',
        'missing.variable',
      ];
      const requiredVariables = [
        'recipient.firstName',
        'token.quantity',
        ...toBeMissing,
      ];

      const availableVariables = {
        recipient: {
          firstName: 'John',
          lastName: 'Doe', // This is NOT in requiredVariables, so it's ignored even if null
          email: 'john@example.com', // This is NOT in requiredVariables, so it's ignored even if null
          city: null, // missing - in requiredVariables
          zipcode: '', // missing - in requiredVariables
          state: 'CA', // This is NOT in requiredVariables, so it's ignored
          country: 'USA', // This is NOT in requiredVariables, so it's ignored
        },
        token: {
          quantity: '100', // present - in requiredVariables
          symbol: 'TKN', // This is NOT in requiredVariables, so it's ignored
        },
        paid: {
          currency: 'USD', // This is NOT in requiredVariables, so it's ignored
          amount: '1000.00', // This is NOT in requiredVariables, so it's ignored
        },
        sale: {
          currency: 'USD', // This is NOT in requiredVariables, so it's ignored
          equivalentAmount: '1000.00', // This is NOT in requiredVariables, so it's ignored
        },
        date: '2024-01-01', // This is NOT in requiredVariables, so it's ignored
      };

      const missingVariables = TransactionsController[
        'computeMissingVariables'
      ](requiredVariables, availableVariables);

      // Only variables that are in requiredVariables AND missing should be returned
      expect(missingVariables).toEqual(toBeMissing);
    });

    it('should handle empty required variables array', () => {
      const missingVariables = TransactionsController[
        'computeMissingVariables'
      ]([], { some: 'data' });

      expect(missingVariables).toEqual([]);
    });

    it('should handle non-array required variables', () => {
      const missingVariables = TransactionsController[
        'computeMissingVariables'
      ]('not an array' as unknown as SaftContract['variables'], {
        some: 'data',
      });

      expect(missingVariables).toEqual([]);
    });

    it('should handle nested object access', () => {
      const requiredVariables = ['deeply.nested.value'];
      const availableVariables = {
        deeply: {
          nested: {
            value: 'exists',
          },
        },
      };

      const missingVariables = TransactionsController[
        'computeMissingVariables'
      ](requiredVariables, availableVariables);

      expect(missingVariables).toEqual([]);
    });

    it('should handle missing nested paths', () => {
      const requiredVariables = ['deeply.nested.missing'];
      const availableVariables = {
        deeply: {
          nested: {
            value: 'exists',
          },
        },
      };

      const missingVariables = TransactionsController[
        'computeMissingVariables'
      ](requiredVariables, availableVariables);

      expect(missingVariables).toEqual(['deeply.nested.missing']);
    });

    it('should ignore variables not in required array even if they have null values', () => {
      const requiredVariables = ['recipient.firstName', 'token.quantity'];
      const availableVariables = {
        recipient: {
          firstName: 'John',
          lastName: null, // This is NOT in requiredVariables, so it's ignored
          email: undefined, // This is NOT in requiredVariables, so it's ignored
        },
        token: {
          quantity: '100',
          symbol: '', // This is NOT in requiredVariables, so it's ignored
        },
        paid: {
          currency: null, // This is NOT in requiredVariables, so it's ignored
          amount: undefined, // This is NOT in requiredVariables, so it's ignored
        },
      };

      const missingVariables = TransactionsController[
        'computeMissingVariables'
      ](requiredVariables, availableVariables);

      // Should return empty array since all required variables have values
      expect(missingVariables).toEqual([]);
    });
  });
});
