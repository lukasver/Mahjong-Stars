import { faker } from "@faker-js/faker";
import { Page } from "@playwright/test";
import { TransactionStatus } from "@prisma/client";
import { KycTierType } from "@/common/schemas/generated";
import { TransactionByIdWithRelations } from "@/common/types/transactions";
import { GetTransactionByIdRes } from "@/lib/types/fetchers";
import { mockTransactions } from "../../mocks/helpers";

/**
 * Mock transaction API response
 */
export async function mockTransactionResponse(
  page: Page,
  data: {
    txId: string;
    status?: TransactionStatus;
    formOfPayment?: "TRANSFER" | "CRYPTO" | "CARD";
    requiresKYC?: KycTierType | null;
    requiresSAFT?: boolean;
    kycCompleted?: boolean;
    saftCompleted?: boolean;
  },
): Promise<void> {
  const {
    txId,
    status = TransactionStatus.PENDING,
    formOfPayment = "TRANSFER",
    requiresKYC = "ENHANCED",
    requiresSAFT = true,
    kycCompleted = false,
    saftCompleted = false,
  } = data;

  // Create a mock transaction
  const mockTx = mockTransactions({
    id: txId,
    status,
    formOfPayment: formOfPayment as any,
    quantity: faker.number.int({ min: 1, max: 1000 }),
    price: faker.number.float({ min: 0.01, max: 100 }),
    totalAmount: faker.number.float({ min: 10, max: 10000 }),
    totalAmountCurrency: formOfPayment === "CRYPTO" ? "ETH" : "USD",
    paidCurrency: formOfPayment === "CRYPTO" ? "ETH" : "USD",
    receivingWallet:
      formOfPayment === "CRYPTO" ? faker.finance.ethereumAddress() : null,
    userId: faker.database.mongodbObjectId(),
    saleId: faker.database.mongodbObjectId(),
  });

  // Build transaction with relations
  const transaction: TransactionByIdWithRelations = {
    ...mockTx,
    sale: {
      id: mockTx.saleId,
      name: "Test Sale",
      requiresKYC: requiresKYC !== null,
      saftCheckbox: requiresSAFT,
      currency: "USD",
      tokenSymbol: "TILE",
      toWalletsAddress: faker.finance.ethereumAddress(),
      tokenPricePerUnit: mockTx.price,
      saftContract: requiresSAFT ? { id: faker.string.uuid() } : null,
      blockchain: {
        explorerUrl: "https://etherscan.io",
      },
    },
    user: {
      walletAddress: faker.finance.ethereumAddress(),
      profile: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
      },
      kycVerification: kycCompleted
        ? {
          id: faker.string.uuid(),
          status: "APPROVED",
          documents: [
            {
              id: faker.string.uuid(),
              url: faker.internet.url(),
              fileName: "kyc-document.pdf",
              name: "KYC Document",
            },
          ],
        }
        : null,
    },
    blockchain: null,
    approver: null,
    tokenDistributions: [],
  } as TransactionByIdWithRelations;

  const bodyRes: GetTransactionByIdRes = {
    transaction,
    requiresKYC,
    requiresSAFT,
    explorerUrl: null,
  };

  // Intercept GET request to /api/proxy/transactions/{id}
  await page.route(`**/api/proxy/transactions/${txId}`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(bodyRes),
      });
    } else {
      await route.continue();
    }
  });

  // Also intercept the query endpoint used by React Query
  await page.route(`**/transactions/${txId}`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            transaction,
            requiresKYC,
            requiresSAFT,
          },
          status: 200,
        }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock card provider availability API response
 */
export async function mockCardProviderAvailability(
  page: Page,
  available: boolean = false,
): Promise<void> {
  await page.route("**/api/card-provider/availability", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            available,
          },
          status: 200,
        }),
      });
    } else {
      await route.continue();
    }
  });
}
