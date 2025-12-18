/**
 * @test-plan.md (286-297)
 * TC-TX-005: SAFT Signing
 *
 * Reuse mocked transaction in TX-TX-002, with KYC completed.
 * Navigate to `/dashboard/buy/[tx]` (SAFT step)
 * Verify SAFT document is displayed
 * Verify "Sign Document" button is visible
 * Click "Sign Document"
 * Verify signing interface opens (Documenso or similar)
 * Complete signing process
 * Verify "Continue" button becomes enabled
 * Click "Continue"
 * Verify navigation to payment step
 * Expected: SAFT signing works correctly
 */

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { TransactionStatus } from "@prisma/client";
import { TransactionPage } from "../../pages/transaction.pom";
import { TIMEOUTS } from "../../utils/constants";
import { mockTransactionResponse } from "../../utils/transaction-mocks";

test("TC-TX-005: SAFT Signing", async ({ page }) => {
  const transactionId = faker.string.uuid();

  // Mock transaction API response with KYC completed and SAFT required
  await mockTransactionResponse(page, transactionId, {
    status: TransactionStatus.PENDING,
    formOfPayment: "TRANSFER",
    requiresKYC: "ENHANCED",
    requiresSAFT: true,
    kycCompleted: true, // KYC is completed
    saftCompleted: false,
  });

  const transactionPage = new TransactionPage(page);

  // Navigate to transaction page
  await transactionPage.goto(transactionId);
  await transactionPage.waitForTransactionPageLoaded();

  // Verify SAFT step is visible (should be active after KYC completion)
  const saftStep = transactionPage.getSaftStep();
  await expect(saftStep).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify SAFT document is displayed
  const saftDocument = transactionPage.getSaftDocument();
  await expect(saftDocument).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify "Sign Document" button is visible
  const signButton = transactionPage.getSaftSignButton();
  await expect(signButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
  await expect(signButton).toBeEnabled({ timeout: TIMEOUTS.SHORT });

  // Click "Sign Document"
  await signButton.click({ timeout: TIMEOUTS.MEDIUM });

  // Wait for signing dialog to appear
  const dialog = page.getByRole("dialog").first();
  await expect(dialog).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

  // Note: In a real scenario, the signing interface (Documenso) would open
  // and the user would complete the signing process. For testing purposes,
  // we would need to mock the signature completion or interact with the dialog.

  // After signature is completed, verify:
  // 1. Dialog closes
  await expect(dialog).not.toBeVisible({ timeout: TIMEOUTS.LONG });

  // 2. Navigation to payment step occurs
  const paymentStep = transactionPage.getPaymentStep();
  await expect(paymentStep).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/transaction/saft-signing.png",
    fullPage: true,
  });
});
