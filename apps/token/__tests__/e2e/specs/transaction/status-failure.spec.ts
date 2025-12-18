/**
 * @test-plan.md (354-359)
 * TC-TX-011: Transaction Status Page (Failure)
 *
 * Navigate to `/dashboard/buy/[tx]/failure`
 * Verify error message is displayed
 * Verify transaction details are displayed
 * Verify "Retry" or "Contact Support" button is visible
 * Expected: Failure status page displays correctly
 */

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { TransactionStatus } from "@prisma/client";
import { TransactionPage } from "../../pages/transaction-page";
import { TIMEOUTS } from "../../utils/constants";
import { mockTransactionResponse } from "../../utils/transaction-mocks";

test("TC-TX-011: Transaction Status Page (Failure)", async ({ page }) => {
  const transactionId = faker.string.uuid();

  // Mock transaction API response with failure status
  await mockTransactionResponse(page, transactionId, {
    status: TransactionStatus.REJECTED,
    formOfPayment: "TRANSFER",
    requiresKYC: "ENHANCED",
    requiresSAFT: true,
    kycCompleted: true,
    saftCompleted: true,
  });

  const transactionPage = new TransactionPage(page);

  // Navigate to failure status page
  await transactionPage.navigateToStatus(transactionId, "failure");
  await transactionPage.waitForTransactionPageLoaded();

  // Verify error message is displayed
  const failureMessage = transactionPage.getFailureMessage();
  await expect(failureMessage).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify transaction details are displayed
  const transactionDetails = transactionPage.getTransactionDetails();
  await expect(transactionDetails).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify "Retry" or "Contact Support" button is visible
  const retryButton = transactionPage.getRetryButton();
  const supportButton = transactionPage.getContactSupportButton();

  const retryButtonCount = await retryButton.count();
  const supportButtonCount = await supportButton.count();

  expect(retryButtonCount > 0 || supportButtonCount > 0).toBe(true);

  if (retryButtonCount > 0) {
    await expect(retryButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
  }

  if (supportButtonCount > 0) {
    await expect(supportButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
  }

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/transaction/status-failure.png",
    fullPage: true,
  });
});
