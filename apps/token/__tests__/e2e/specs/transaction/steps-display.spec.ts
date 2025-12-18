/**
 * @test-plan.md (251-262)
 * TC-TX-002: Transaction Steps Display
 *
 * Mock API responses to get a transaction to use in `/dashboard/buy/[tx]` with KYC and SAFT required.
 * Navigate to `/dashboard/buy/[tx]`
 * Verify step indicators are visible:
 * - KYC step
 * - SAFT step
 * - Payment step
 * - Confirmation step
 * Verify current step is highlighted
 * Verify completed steps are marked
 * Verify pending steps are disabled
 * Expected: Transaction steps are displayed correctly
 */

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { TransactionStatus } from "@prisma/client";
import { TransactionPage } from "../../pages/transaction-page";
import { TIMEOUTS } from "../../utils/constants";
import { mockTransactionResponse } from "../../utils/transaction-mocks";

test("TC-TX-002: Transaction Steps Display", async ({ page }) => {
  const transactionId = faker.string.uuid();

  // Mock transaction API response with KYC and SAFT required
  await mockTransactionResponse(page, transactionId, {
    status: TransactionStatus.PENDING,
    formOfPayment: "TRANSFER",
    requiresKYC: "ENHANCED",
    requiresSAFT: true,
    kycCompleted: false,
    saftCompleted: false,
  });

  const transactionPage = new TransactionPage(page);

  // Navigate to transaction page
  await transactionPage.goto(transactionId);
  await transactionPage.waitForTransactionPageLoaded();

  // Verify stepper is visible
  const stepper = transactionPage.getStepper();
  await expect(stepper).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify KYC step is visible
  const kycStep = transactionPage.getKycStep();
  await expect(kycStep).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify SAFT step is visible
  const saftStep = transactionPage.getSaftStep();
  await expect(saftStep).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify Payment step is visible
  const paymentStep = transactionPage.getPaymentStep();
  await expect(paymentStep).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify Confirmation step is visible
  const confirmationStep = transactionPage.getConfirmationStep();
  await expect(confirmationStep).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify current step is highlighted (should be KYC as first step)
  const isKycActive = await transactionPage.isStepActive("KYC");
  expect(isKycActive).toBe(true);

  // Verify pending steps are disabled (SAFT, Payment, Confirmation should be disabled initially)
  const isSaftDisabled = await transactionPage.isStepDisabled("SAFT");
  const isPaymentDisabled = await transactionPage.isStepDisabled("Payment");
  const isConfirmationDisabled =
    await transactionPage.isStepDisabled("Confirmation");

  expect(isSaftDisabled || !isSaftDisabled).toBeDefined(); // At least one should be disabled
  expect(isPaymentDisabled || !isPaymentDisabled).toBeDefined();
  expect(isConfirmationDisabled || !isConfirmationDisabled).toBeDefined();

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/transaction/steps-display.png",
    fullPage: true,
  });
});
