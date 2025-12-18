/**
 * @test-plan.md (347-352)
 * TC-TX-010: Transaction Status Page (Pending)
 *
 * Navigate to `/dashboard/buy/[tx]/pending`
 * Verify pending message is displayed
 * Verify transaction details are displayed
 * Verify estimated processing time is displayed (if applicable)
 * Expected: Pending status page displays correctly
 */

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { TransactionStatus } from "@prisma/client";
import { TransactionPage } from "../../pages/transaction.pom";
import { TIMEOUTS } from "../../utils/constants";
import { mockTransactionResponse } from "../../utils/transaction-mocks";

test("TC-TX-010: Transaction Status Page (Pending)", async ({ page }) => {
  const transactionId = faker.string.uuid();

  // Mock transaction API response with pending status
  await mockTransactionResponse(page, transactionId, {
    status: TransactionStatus.PAYMENT_SUBMITTED,
    formOfPayment: "TRANSFER",
    requiresKYC: "ENHANCED",
    requiresSAFT: true,
    kycCompleted: true,
    saftCompleted: true,
  });

  const transactionPage = new TransactionPage(page);

  // Navigate to pending status page
  await transactionPage.navigateToStatus(transactionId, "pending");
  await transactionPage.waitForTransactionPageLoaded();

  // Verify pending message is displayed
  const pendingMessage = transactionPage.getPendingMessage();
  await expect(pendingMessage).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify transaction details are displayed
  const transactionDetails = transactionPage.getTransactionDetails();
  await expect(transactionDetails).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify estimated processing time is displayed (if applicable)
  const processingTime = transactionPage.getEstimatedProcessingTime();
  const processingTimeCount = await processingTime.count();
  if (processingTimeCount > 0) {
    await expect(processingTime).toBeVisible({ timeout: TIMEOUTS.SHORT });
  }

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/transaction/status-pending.png",
    fullPage: true,
  });
});
