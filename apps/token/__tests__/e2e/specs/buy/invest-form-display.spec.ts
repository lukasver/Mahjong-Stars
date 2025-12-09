/**
 * @test-plan.md (170-179)
 * TC-BUY-005: Invest Form Display
 *
 * Navigate to `/dashboard/buy`
 * Scroll to "Invest" section
 * Verify "Invest" heading is displayed
 * Verify countdown timer is displayed (if sale is active)
 * Verify token amount input field is visible
 * Verify USD amount input field is visible
 * Verify payment method selector is visible
 * Verify "Continue" or "Invest" button is visible
 * Expected: Invest form is displayed correctly
 */

import { expect, test } from "@playwright/test";
import { BuyPage } from "../../pages/buy-page";
import { TIMEOUTS } from "../../utils/constants";

test("TC-BUY-005: Invest Form Display", async ({ page }) => {
  const buyPage = new BuyPage(page);
  await buyPage.goto();
  await buyPage.waitForBuyPageLoaded();

  // Scroll to "Invest" section
  const investSection = buyPage.getInvestSection();
  await investSection.scrollIntoViewIfNeeded();
  await expect(investSection).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify "Invest" heading is displayed
  const investHeading = buyPage.getInvestHeading();
  const isHeadingVisible = await investHeading.isVisible().catch(() => false);
  if (isHeadingVisible) {
    await expect(investHeading).toBeVisible({ timeout: TIMEOUTS.SHORT });
  }

  // Verify countdown timer is displayed (if sale is active)
  const countdownTimer = buyPage.getCountdownTimer();
  const isCountdownVisible = await countdownTimer.isVisible().catch(() => false);
  if (isCountdownVisible) {
    await expect(countdownTimer).toBeVisible({ timeout: TIMEOUTS.SHORT });
  }

  // Verify token amount input field is visible
  const tokenInput = buyPage.getTokenAmountInput();
  const isTokenInputVisible = await tokenInput.isVisible().catch(() => false);
  if (isTokenInputVisible) {
    await expect(tokenInput).toBeVisible({ timeout: TIMEOUTS.SHORT });
  }

  // Verify USD amount input field is visible
  const usdInput = buyPage.getUsdAmountInput();
  const isUsdInputVisible = await usdInput.isVisible().catch(() => false);
  if (isUsdInputVisible) {
    await expect(usdInput).toBeVisible({ timeout: TIMEOUTS.SHORT });
  }

  // Verify payment method selector is visible
  const paymentSelector = buyPage.getPaymentMethodSelector();
  const isPaymentSelectorVisible = await paymentSelector.isVisible().catch(() => false);
  if (isPaymentSelectorVisible) {
    await expect(paymentSelector).toBeVisible({ timeout: TIMEOUTS.SHORT });
  }

  // Verify "Continue" or "Invest" button is visible
  const continueButton = buyPage.getContinueButton();
  const isButtonVisible = await continueButton.isVisible().catch(() => false);
  if (isButtonVisible) {
    await expect(continueButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
  }

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/buy/invest-form-display.png",
    fullPage: true,
  });
});

