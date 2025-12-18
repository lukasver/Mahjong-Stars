/**
 * @test-plan.md (320-328)
 * TC-TX-007: Payment Step (CRYPTO)
 *
 * Reuse mocked transaction in TX-TX-002, with KYC and SAFT completed and FOP CRYPTO.
 * Navigate to `/dashboard/buy/[tx]` (Payment step, CRYPTO)
 * Verify payment amount in crypto is displayed
 * Verify wallet address is displayed
 * Verify QR code is displayed (if applicable)
 * Verify network/chain information is displayed
 * Verify "I've Sent Payment" or "Confirm Payment" button is visible
 * Expected: CRYPTO payment step displays correctly
 */

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { TransactionPage } from "../../pages/transaction.pom";
import { TIMEOUTS } from "../../utils/constants";

test("TC-TX-007: Payment Step (CRYPTO)", async ({ page }) => {
  const transactionId = faker.string.uuid();

  const transactionPage = new TransactionPage(page);

  // Navigate to transaction page
  await transactionPage.goto(transactionId);
  await transactionPage.waitForTransactionPageLoaded();

  // Verify payment step is visible
  const paymentStep = transactionPage.getPaymentStep();
  await expect(paymentStep).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify payment amount in crypto is displayed
  const paymentAmount = transactionPage.getPaymentAmount();
  await expect(paymentAmount).toBeVisible({ timeout: TIMEOUTS.SHORT });
  const amountText = await paymentAmount.textContent();
  expect(amountText).toMatch(/ETH|BTC|USDC|BNB|USDT/i);

  // Verify wallet address is displayed
  const walletAddress = transactionPage.getWalletAddress();
  await expect(walletAddress).toBeVisible({ timeout: TIMEOUTS.SHORT });
  const addressText = await walletAddress.textContent();
  expect(addressText).toMatch(/0x[a-fA-F0-9]{40}/i); // Ethereum address pattern

  // Verify QR code is displayed (if applicable)
  const qrCode = transactionPage.getQRCode();
  const qrCodeCount = await qrCode.count();
  if (qrCodeCount > 0) {
    await expect(qrCode).toBeVisible({ timeout: TIMEOUTS.SHORT });
  }

  // Verify network/chain information is displayed
  const networkInfo = transactionPage.getNetworkInfo();
  await expect(networkInfo).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify "I've Sent Payment" or "Confirm Payment" button is visible
  const submitButton = transactionPage.getPaymentSubmitButton();
  await expect(submitButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
  await expect(submitButton).toBeEnabled({ timeout: TIMEOUTS.SHORT });
  const buttonText = await submitButton.textContent();
  expect(buttonText).toMatch(/I've Sent|Confirm Payment|Sent Payment/i);

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/transaction/payment-step-crypto.png",
    fullPage: true,
  });
});
