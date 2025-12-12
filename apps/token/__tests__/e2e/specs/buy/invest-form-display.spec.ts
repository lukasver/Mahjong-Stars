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

  // Verify "Invest" heading is displayed (required)
  const investHeading = buyPage.getInvestHeading();
  await expect(investHeading).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify countdown timer is displayed (if sale is active)
  // Note: Countdown may not be present if sale is not active, so we check conditionally
  const countdownTimer = buyPage.getCountdownTimer();
  const countdownCount = await countdownTimer.count();
  if (countdownCount > 0) {
    await expect(countdownTimer).toBeVisible({ timeout: TIMEOUTS.SHORT });
  }

  // Verify token amount input field is visible (required)
  const tokenInput = buyPage.getTokenAmountInput();
  await expect(tokenInput).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify USD amount input field is visible (required)
  const usdInput = buyPage.getTotalAmountInput();
  await expect(usdInput).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify payment method selector is visible (required)
  const paymentSelector = buyPage.getPaymentMethodSelector();
  await expect(paymentSelector).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify currency options are available when clicking the combobox
  await paymentSelector.click();

  // Wait for dropdown to open
  await page.waitForTimeout(300);

  // Verify FIAT section header is visible
  const fiatHeader = buyPage.getFiatSectionHeader();
  await expect(fiatHeader).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify CRYPTO section header is visible
  const cryptoHeader = buyPage.getCryptoSectionHeader();
  await expect(cryptoHeader).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify all FIAT currencies are present
  const fiatCurrencies = ["CHF", "EUR", "USD", "GBP"];
  for (const currency of fiatCurrencies) {
    const currencyOption = buyPage.getCurrencyOption(currency);
    await expect(currencyOption).toBeVisible({ timeout: TIMEOUTS.SHORT });
  }

  // Verify all CRYPTO currencies are present
  const cryptoCurrencies = ["ETH", "BTC", "USDC", "BNB", "USDT"];
  for (const currency of cryptoCurrencies) {
    const currencyOption = buyPage.getCurrencyOption(currency);
    await expect(currencyOption).toBeVisible({ timeout: TIMEOUTS.SHORT });
  }

  // Close the dropdown by clicking outside or pressing Escape
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);

  // Verify "Continue" or "Invest" button is visible (required)
  const continueButton = buyPage.getContinueButton();
  await expect(continueButton).toBeVisible({ timeout: TIMEOUTS.SHORT });

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/buy/invest-form-display.png",
    fullPage: true,
  });
});

