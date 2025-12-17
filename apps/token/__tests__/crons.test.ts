import { faker } from "@faker-js/faker";
import {
  FOP,
  Prisma,
  Sale,
  SaleStatus,
  SaleTransactions,
  TransactionStatus,
  User,
} from "@prisma/client";
import { DateTime } from "luxon";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { prisma as db } from "@/lib/db/prisma";
import transactionsController from "@/lib/repositories/transactions";
import {
  cleanUpTestContext,
  createScenario,
  mockTransactions,
} from "./mocks/helpers";

vi.mock("server-only", () => {
  return {};
});

describe.sequential("crons.cleanUp", () => {
  describe("transactions-cleanup", () => {
    let testSale: Sale;
    let regularUser: User;
    let adminUser: User;
    const transactions: SaleTransactions[] = [];

    beforeAll(async () => {
      // setup
      // create scenario
      const { sale, user, admin, transaction } = await createScenario(db);
      testSale = sale;
      regularUser = user;
      adminUser = admin;
      transactions.push(transaction);

      const sevenHoursAgo = DateTime.local().minus({ hours: 7 }).toJSDate();

      expect(sale.status).toBe(SaleStatus.OPEN);

      // create many random transactions
      const txs = Array.from({
        length: faker.number.int({ min: 1, max: 50 }),
      }).map(() => {
        const tx = mockTransactions(
          {
            saleId: testSale.id,
            userId: faker.helpers.arrayElement([regularUser.id, adminUser.id]),
            status: faker.helpers.arrayElement(
              Object.values(TransactionStatus).filter((status) => status !== TransactionStatus.CANCELLED),
            ),
            formOfPayment: faker.helpers.arrayElement(Object.values(FOP)),
            createdAt: faker.helpers.arrayElement([
              faker.date.recent({ days: 25 }),
              sevenHoursAgo,
              DateTime.local().minus({ hours: 1 }).toJSDate(),
            ]),
          },
          "createMany",
        );
        return tx;
      });

      // create many AWAITING_PAYMENT+CARD txs
      const awaitingPaymentCardTxs = Array.from({
        length: faker.number.int({ min: 1, max: 10 }),
      }).map(() => {
        return mockTransactions(
          {
            saleId: testSale.id,
            userId: faker.helpers.arrayElement([regularUser.id, adminUser.id]),
            status: TransactionStatus.AWAITING_PAYMENT,
            formOfPayment: FOP.CARD,
            // Both older and newer than 6 hours should be preserved
            createdAt: faker.helpers.arrayElement([
              sevenHoursAgo,
              DateTime.local().minus({ hours: 1 }).toJSDate(),
            ]),
          },
          "createMany",
        );
      });

      // create many deleteable txs
      const deleteableTxs = Array.from({
        length: faker.number.int({ min: 1, max: 10 }),
      }).map(() => {
        return mockTransactions(
          {
            saleId: testSale.id,
            userId: faker.helpers.arrayElement([regularUser.id, adminUser.id]),
            status: TransactionStatus.PENDING,
            formOfPayment: faker.helpers.arrayElement([
              FOP.TRANSFER,
              FOP.CRYPTO,
            ]),
            createdAt: sevenHoursAgo,
          },
          "createMany",
        );
      });

      const results = await Promise.all([
        db.saleTransactions.createManyAndReturn({
          data: txs,
        }),
        db.saleTransactions.createManyAndReturn({
          data: awaitingPaymentCardTxs,
        }),
        db.saleTransactions.createManyAndReturn({
          data: deleteableTxs,
        }),
      ]);

      transactions.push(...results.flat());
      expect(transactions.every((tx) => tx.saleId === testSale.id)).toBe(true);
    });

    afterAll(async () => {
      await cleanUpTestContext(db, {
        transactions,
        sales: [testSale],
        users: [regularUser, adminUser],
      });
    });

    test("should clean up old transactions but preserve reserved CARD+AWAITING_PAYMENT transactions", async () => {
      // Pending txs older than 6 hours

      const isDeleteableTx = (tx: SaleTransactions): boolean => ([TransactionStatus.PENDING].includes(tx.status) || (
        tx.status === TransactionStatus.AWAITING_PAYMENT &&
        tx.formOfPayment !== FOP.CARD
      )) && tx.createdAt < DateTime.local().minus({ hours: 6 }).toJSDate();
      const DELETEABLE_TXS = transactions.filter(
        (tx) => isDeleteableTx(tx)
      );
      // AWAITING_PAYMENT+CARD txs no matter the createdAt
      const RESERVED_TXS = transactions.filter(
        (tx) =>
          tx.status === TransactionStatus.AWAITING_PAYMENT &&
          tx.formOfPayment === FOP.CARD,
      );

      // Includes reserved and others that shouldn't be deleted
      const NON_DELETEABLE_TXS = transactions.filter(
        (tx) => !isDeleteableTx(tx)
      );
      expect(DELETEABLE_TXS.length).toBeGreaterThan(0);
      expect(RESERVED_TXS.length).toBeGreaterThan(0);
      // Because is a superset
      expect(NON_DELETEABLE_TXS.length).toBeGreaterThan(RESERVED_TXS.length);
      expect(NON_DELETEABLE_TXS.length + DELETEABLE_TXS.length).toBe(transactions.length);

      // No id in deleteable_txs should exists in non_deleteable_txs, use a MAP for efficiency
      const deleteableTxMap = new Map(DELETEABLE_TXS.map((tx) => [tx.id, tx]));
      const nonDeleteableTxMap = new Map(NON_DELETEABLE_TXS.map((tx) => [tx.id, tx]));
      expect(DELETEABLE_TXS.every((tx) => !nonDeleteableTxMap.has(tx.id))).toBe(true);
      expect(NON_DELETEABLE_TXS.every((tx) => !deleteableTxMap.has(tx.id))).toBe(true);


      // Get initial available token quantity
      const saleBefore = await db.sale.findUnique({
        where: { id: testSale.id },
        select: { availableTokenQuantity: true },
      });

      const initialAvailable = saleBefore?.availableTokenQuantity || 0;

      // Run cleanup
      const result = await transactionsController.crons.cleanUp();

      // Verify cleanup succeeded
      expect(result.success).toBe(true);

      // Verify transactions that should be cleaned up are now CANCELLED

      const cleanedTxs = await db.saleTransactions.findMany({
        where: {
          id: {
            in: DELETEABLE_TXS.map((tx) => tx.id),
          },
        },
        select: {
          id: true,
          status: true,
          comment: true,
        },
      });

      const DELETION_COMMENT = "Transaction cancelled for not being confirmed after time limit";
      expect(cleanedTxs.length).toBe(DELETEABLE_TXS.length);
      expect(
        cleanedTxs.every((tx) => tx.status === TransactionStatus.CANCELLED),
      ).toBe(true);
      expect(
        cleanedTxs.every((tx) =>
          tx.comment?.includes(
            DELETION_COMMENT,
          ),
        ),
      ).toBe(true);

      const reservedTxAfter = await db.saleTransactions.findMany({
        where: {
          id: {
            in: RESERVED_TXS.map((tx) => tx.id),
          },
        },
        select: {
          id: true,
          status: true,
          formOfPayment: true,
          comment: true,
        },
      });
      expect(reservedTxAfter.length).toBe(RESERVED_TXS.length);
      expect(
        reservedTxAfter.every(
          (tx) => tx.status === TransactionStatus.AWAITING_PAYMENT,
        ),
      ).toBe(true);
      expect(reservedTxAfter.every((tx) => tx.formOfPayment === FOP.CARD)).toBe(
        true,
      );
      expect(reservedTxAfter.every((tx) => !tx.comment?.includes(DELETION_COMMENT)), `Comments:
      ${reservedTxAfter.map((tx) => tx.comment).join("\n")}`).toBe(true);

      // Verify sale available token quantity was restored for cleaned transactions
      const restoredTokens = DELETEABLE_TXS.reduce((acc, tx) => acc.add(tx.quantity), new Prisma.Decimal(0));
      const saleAfter = await db.sale.findUnique({
        where: { id: testSale.id },
        select: { availableTokenQuantity: true },
      });
      const finalAvailable = saleAfter?.availableTokenQuantity || 0;
      expect(finalAvailable).toBe(initialAvailable + restoredTokens.toNumber()); // Only cleaned transactions restored


      // Check that no other transactions were affected
      const otherTxs = await db.saleTransactions.findMany({
        where: {
          id: { in: NON_DELETEABLE_TXS.map((tx) => tx.id) }
        },
        select: {
          id: true,
          status: true,
          comment: true,
          createdAt: true,
          formOfPayment: true,
        },
      });

      expect(otherTxs.length).toBe(NON_DELETEABLE_TXS.length);
      expect(otherTxs.every((tx) => tx.status !== TransactionStatus.CANCELLED), `
      Cancelled txs:
      ${otherTxs.filter((tx) => tx.status !== TransactionStatus.CANCELLED).map((tx) => JSON.stringify(tx)).join("\n")}`).toBe(true);
      expect(otherTxs.every((tx) => tx.comment?.includes(DELETION_COMMENT))).toBe(false);
    });
  });
});
