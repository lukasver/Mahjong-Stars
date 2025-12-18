import { faker } from "@faker-js/faker";
import { Page } from "@playwright/test";
import { KycTierType } from "@/common/schemas/generated";
import { TransactionByIdWithRelations } from "@/common/types/transactions";
import { GetTransactionByIdRes } from "@/lib/types/fetchers";

/**
 * Mock transaction API response
 */
export async function mockTransactionResponse(
  page: Page,
  tx: TransactionByIdWithRelations,
  overrides: {
    transaction: Partial<TransactionByIdWithRelations>;
    requiresKYC?: KycTierType | null;
    requiresSAFT?: boolean;
    kycCompleted?: boolean;
  },
): Promise<void> {
  const {
    transaction: ovTransactionData,
    requiresKYC = "ENHANCED",
    requiresSAFT = true,
    kycCompleted = false,
  } = overrides;


  // Build transaction with relations
  const transaction: TransactionByIdWithRelations = {
    ...ovTransactionData,
    sale: {
      id: tx.sale.id,
      ...ovTransactionData?.sale,
    },
    user: {
      ...tx.user,
      walletAddress: tx.user.walletAddress,
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
    explorerUrl: tx.sale.blockchain?.explorerUrl || null,
  };

  // Intercept GET request to /api/proxy/transactions/{id}
  // await page.route(`**/api/proxy/transactions/${tx.id}`, async (route) => {
  //   if (route.request().method() === "GET") {
  //     await route.fulfill({
  //       status: 200,
  //       contentType: "application/json",
  //       body: JSON.stringify(bodyRes),
  //     });
  //   } else {
  //     await route.continue();
  //   }
  // });

  // Also intercept the query endpoint used by React Query
  await page.route(`**/transactions/${tx.id}`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: bodyRes,
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
