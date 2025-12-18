import { invariant } from "@epic-web/invariant";
import { faker } from "@faker-js/faker";
import { test as base } from "@playwright/test";
import { BankDetails, FOP, SaleStatus, TransactionStatus } from "@prisma/client";
import { getUserWalletAddressFromStorage } from "__tests__/e2e/utils/helpers";
import { mockTransactions } from "__tests__/mocks/helpers";
import {
  TransactionByIdWithRelations,
  transactionByIdWithRelations,
} from "@/common/types/transactions";
import { TransactionPage } from "../../pages/transaction.pom";
import { testDb } from "../../utils/db";

type TransactionEntities = {
  saleTransactions: TransactionByIdWithRelations[];
};

type BankEntities = {
  banks: Pick<BankDetails, "id">[];
};

type Entities = TransactionEntities & BankEntities;

// Declare the types of your fixtures.
type TransactionFixtures = {
  tx001: TransactionPage;
  //TODO! make fixtures for other test cases.
  entities: Map<string, Entities>;
};

/** Created resources */
const entities: Map<string, Entities> = new Map();

// Extend base test by providing "todoPage" and "settingsPage".
// This new "test" can be used in multiple test files, and each of them will get the fixtures.
export const test = base.extend<TransactionFixtures>({
  tx001: async ({ page, context }, use) => {
    const [currentUser, openSale] = await testDb.$transaction([
      testDb.user.findUniqueOrThrow({
        where: {
          walletAddress: await getUserWalletAddressFromStorage(context),
        },
      }),
      testDb.sale.findFirstOrThrow({
        where: {
          status: SaleStatus.OPEN,
        },
      }),
    ]);

    const {
      include: { tokenDistributions: _, ...rest },
    } = transactionByIdWithRelations;

    const txs = await testDb.saleTransactions.createManyAndReturn({
      data: Array.from({ length: 1 }).map(() =>
        mockTransactions(
          {
            userId: currentUser.id,
            saleId: openSale.id,
            formOfPayment: FOP.TRANSFER,
            status: TransactionStatus.PENDING,
          },
          "createMany",
        ),
      ),
      include: {
        ...rest,
      },
    });

    const originalKyc = openSale.requiresKYC;
    const originalSaft = openSale.saftCheckbox;
    const { banks } = await testDb.sale.update({
      where: { id: openSale.id },
      data: {
        requiresKYC: false,
        saftCheckbox: false,
        banks: {
          // need to add a bank to make it logically possible to select transfer as FOP
          create: {
            bankName: faker.company.name(),
            iban: faker.finance.iban(),
          },
        },
      },
      select: {
        banks: {
          select: {
            id: true,
          }
        }
      }
    });

    invariant(txs.length > 0, "Failed to create transaction");

    const tempEntities = {} as Entities;
    // Expand if needed
    tempEntities.saleTransactions = txs as TransactionByIdWithRelations[];
    tempEntities.banks = banks;

    // Set up the fixture.
    const todoPage = new TransactionPage(page);

    entities.set(todoPage.pageId, tempEntities);

    // Use the fixture value in the test.
    await use(todoPage);

    // Clean up the db & fixture;
    await testDb.$transaction(async (prisma) => {
      await prisma.saleTransactions.deleteMany({
        where: {
          id: {
            in: tempEntities["saleTransactions"].map((t) => t.id),
          },
        },
      });
      await prisma.bankDetails.deleteMany({
        where: {
          id: {
            in: tempEntities["banks"].map((b) => b.id),
          },
        },
      });
      await prisma.sale.update({
        where: { id: openSale.id },
        data: { requiresKYC: originalKyc, saftCheckbox: originalSaft },
      });
    });
    await testDb.$disconnect();
    entities.delete(todoPage.pageId);
  },
  entities,
});

export { expect } from "@playwright/test";
