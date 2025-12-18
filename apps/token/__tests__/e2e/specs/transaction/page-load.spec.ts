/**
 * @test-plan.md (243-249)
 * TC-TX-001: Transaction Page Load
 *
 * Mock API responses to get a transaction to use in `/dashboard/buy/[tx]`.
 * Navigate to `/dashboard/buy/[tx]`
 * Verify transaction page loads
 * Verify transaction ID is displayed
 * Verify transaction steps are visible
 * Expected: Transaction page loads successfully
 */

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { TransactionStatus } from "@prisma/client";
import { TransactionPage } from "../../pages/transaction-page";
import { TIMEOUTS } from "../../utils/constants";
import { mockTransactionResponse } from "../../utils/transaction-mocks";

test("TC-TX-001: Transaction Page Load", async ({ page }) => {
  const transactionId = faker.string.uuid();

  // Mock transaction API response
  await mockTransactionResponse(page, transactionId, {
    status: TransactionStatus.PENDING,
    formOfPayment: "TRANSFER",
    requiresKYC: "ENHANCED",
    requiresSAFT: true,
  });

  const transactionPage = new TransactionPage(page);

  // Navigate to transaction page
  await transactionPage.goto(transactionId);
  await transactionPage.waitForTransactionPageLoaded();

  // Verify transaction page is displayed
  await transactionPage.verifyTransactionPageDisplayed();

  // Verify transaction ID is displayed (check URL matches)
  expect(page.url()).toContain(transactionId);

  // Verify transaction steps are visible
  const stepper = transactionPage.getStepper();
  await expect(stepper).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify at least one step is visible
  const kycStep = transactionPage.getKycStep();
  await expect(kycStep).toBeVisible({ timeout: TIMEOUTS.SHORT });

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/transaction/page-load.png",
    fullPage: true,
  });
});
