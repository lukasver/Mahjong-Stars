/**
 * @test-plan.md (309-318)
 * TC-TX-006-B: Payment Step (FIAT/CARD)
 *
 * Reuse mocked transaction in TX-TX-002, with KYC and SAFT completed and FOP CARD.
 * Mock API call to `api/card-provider/availability` to mock unavailable service
 * Navigate to `/dashboard/buy/[tx]` (Payment step)
 * Verify payment amount is displayed
 * Verify payment method is "FIAT"
 * Verify payment instructions are displayed
 * Verify payment reference/ID is displayed
 * Verify "Mark as Paid" or "Submit Payment" button is visible
 * Expected: FIAT payment step displays correctly
 */

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { TransactionPage } from "../../pages/transaction.pom";
import { TIMEOUTS } from "../../utils/constants";

test("TC-TX-006-B: Payment Step (FIAT/CARD)", async ({ page }) => {
  const transactionId = faker.string.uuid();

  const transactionPage = new TransactionPage(page);

  // Mock card provider availability as unavailable
  await transactionPage.mockCardProviderAvailability(false);

  // Navigate to transaction page
  await transactionPage.goto(transactionId);
  await transactionPage.waitForTransactionPageLoaded();

  // Verify payment step is visible
  const paymentStep = transactionPage.getPaymentStep();
  await expect(paymentStep).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify payment amount is displayed
  const paymentAmount = transactionPage.getPaymentAmount();
  await expect(paymentAmount).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify payment method is "FIAT" or "CARD"
  const paymentMethod = transactionPage.getPaymentMethod();
  await expect(paymentMethod).toBeVisible({ timeout: TIMEOUTS.SHORT });
  const paymentMethodText = await paymentMethod.textContent();
  expect(paymentMethodText).toMatch(/FIAT|CARD|Credit Card/i);

  // Verify payment instructions are displayed
  const paymentInstructions = transactionPage.getPaymentInstructions();
  await expect(paymentInstructions).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify payment reference/ID is displayed
  const paymentReference = transactionPage.getPaymentReference();
  await expect(paymentReference).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify "Mark as Paid" or "Submit Payment" button is visible
  const submitButton = transactionPage.getPaymentSubmitButton();
  await expect(submitButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
  await expect(submitButton).toBeEnabled({ timeout: TIMEOUTS.SHORT });

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/transaction/payment-step-fiat-card.png",
    fullPage: true,
  });
});
