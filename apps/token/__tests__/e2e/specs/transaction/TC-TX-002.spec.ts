/**
 * @test-plan.md (251-262)
 * TC-TX-002: Transaction Steps Display
 * Implement and use tx002 fixture to get a transaction to use in `/dashboard/buy/[tx]` with KYC and SAFT required.
 * Navigate to `/dashboard/buy/[tx]`
 * Verify step indicators are visible:
 * - KYC step
 * - SAFT step
 * - Payment step
 * - Confirmation step
 * Verify current step is highlighted
 * Verify completed steps are marked (none since starts at the first step)
 * Verify pending steps are disabled
 * Expected: Transaction steps are displayed correctly
 */

import { invariant } from "@epic-web/invariant";
import { FOP } from "@prisma/client";
import { TIMEOUTS } from "../../utils/constants";
import { expect, test } from "./transaction.fixtures";

test("TC-TX-002: Transaction Steps Display", async ({
  tx002: txPage,
  entities,
}) => {
  const { page } = txPage;
  const pageEntities = entities.get(txPage.pageId);

  const tx = pageEntities?.saleTransactions.find(
    (t) => t.formOfPayment === FOP.TRANSFER,
  );

  invariant(tx, "Transaction not found");

  // Mock transaction API response with KYC and SAFT required
  await txPage.mockTransactionResponse(tx, {
    transaction: {
      status: tx.status,
      formOfPayment: tx.formOfPayment,
    },
    requiresKYC: "ENHANCED",
    requiresSAFT: true,
    kycCompleted: false,
  });

  // Navigate to transaction page
  await txPage.goto(tx.id);
  await txPage.waitForTransactionPageLoaded();

  // Verify stepper is visible
  const stepper = txPage.getStepper();
  await expect(stepper).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify all step indicators are visible
  const kycStep = txPage.getKycStep();
  await expect(kycStep).toBeVisible({ timeout: TIMEOUTS.SHORT });

  const saftStep = txPage.getSaftStep();
  await expect(saftStep).toBeVisible({ timeout: TIMEOUTS.SHORT });

  const paymentStep = txPage.getPaymentStep();
  await expect(paymentStep).toBeVisible({ timeout: TIMEOUTS.SHORT });

  const confirmationStep = txPage.getConfirmationStep();
  await expect(confirmationStep).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify current step is highlighted (KYC should be active as first step)
  const isKycActive = await txPage.isStepActive("KYC");
  expect(isKycActive).toBe(true);

  // Verify no steps are completed (starting at first step)
  const isKycCompleted = await txPage.isStepCompleted("KYC");
  const isSaftCompleted = await txPage.isStepCompleted("SAFT");
  const isPaymentCompleted = await txPage.isStepCompleted("Payment");
  const isConfirmationCompleted = await txPage.isStepCompleted("Confirmation");

  expect(isKycCompleted).toBe(false);
  expect(isSaftCompleted).toBe(false);
  expect(isPaymentCompleted).toBe(false);
  expect(isConfirmationCompleted).toBe(false);

  // Verify pending steps are inactive (not yet reached)
  const isSaftInactive = await txPage.isStepInactive("SAFT");
  const isPaymentInactive = await txPage.isStepInactive("Payment");
  const isConfirmationInactive = await txPage.isStepInactive("Confirmation");

  expect(isSaftInactive).toBe(true);
  expect(isPaymentInactive).toBe(true);
  expect(isConfirmationInactive).toBe(true);

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/transaction/steps-display.png",
    fullPage: true,
  });
});
