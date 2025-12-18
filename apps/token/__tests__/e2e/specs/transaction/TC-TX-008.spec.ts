/**
 * @test-plan.md (330-336)
 * TC-TX-008: Payment Submission
 *
 * Navigate to `/dashboard/buy/[tx]` (Payment step)
 * Click payment confirmation button
 * Verify confirmation dialog appears (if applicable)
 * Confirm payment submission
 * Verify navigation to confirmation/status page
 * Expected: Payment submission works correctly
 */

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { TransactionPage } from "../../pages/transaction.pom";
import { TIMEOUTS } from "../../utils/constants";

test("TC-TX-008: Payment Submission", async ({ page }) => {
  const transactionId = faker.string.uuid();

  const transactionPage = new TransactionPage(page);

  // Navigate to transaction page
  await transactionPage.goto(transactionId);
  await transactionPage.waitForTransactionPageLoaded();

  // Verify payment step is visible
  const paymentStep = transactionPage.getPaymentStep();
  await expect(paymentStep).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Get payment submit button
  const submitButton = transactionPage.getPaymentSubmitButton();
  await expect(submitButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
  await expect(submitButton).toBeEnabled({ timeout: TIMEOUTS.SHORT });

  // Click payment confirmation button
  await submitButton.click({ timeout: TIMEOUTS.MEDIUM });

  // Wait a bit for potential confirmation dialog
  await page.waitForTimeout(1000);

  // Check if confirmation dialog appears
  const dialog = page.getByRole("dialog").first();
  const dialogCount = await dialog.count();

  if (dialogCount > 0) {
    // Verify confirmation dialog is visible
    await expect(dialog).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Confirm payment submission
    const confirmButton = dialog
      .getByRole("button", { name: /Confirm|Submit|Yes/i })
      .first();
    await expect(confirmButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
    await confirmButton.click({ timeout: TIMEOUTS.SHORT });
  }

  // Verify navigation to confirmation/status page
  // The page might navigate to a success or confirmation page
  await page.waitForTimeout(2000);

  // Check if URL changed or confirmation step is visible
  const confirmationStep = transactionPage.getConfirmationStep();
  const confirmationCount = await confirmationStep.count();

  if (confirmationCount > 0) {
    await expect(confirmationStep).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  } else {
    // Or check if URL changed to a status page
    const url = page.url();
    expect(url).toMatch(
      /\/dashboard\/buy\/[^/]+\/(success|confirmation|pending)/i,
    );
  }

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/transaction/payment-submission.png",
    fullPage: true,
  });
});
