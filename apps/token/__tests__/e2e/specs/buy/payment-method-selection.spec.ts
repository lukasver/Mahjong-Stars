/**
 * @test-plan.md (200-207)
 * TC-BUY-008: Payment Method Selection
 *
 * Navigate to `/dashboard/buy`
 * Verify payment method dropdown/selector is visible
 * Select "FIAT" payment method
 * Verify form updates for FIAT payment
 * Select "CRYPTO" payment method
 * Verify form updates for CRYPTO payment
 * Expected: Payment method selection works correctly
 */

import { expect, test } from "@playwright/test";
import { BuyPage } from "../../pages/buy-page";
import { TIMEOUTS } from "../../utils/constants";

test("TC-BUY-008: Payment Method Selection", async ({ page }) => {
  const buyPage = new BuyPage(page);
  await buyPage.goto();
  await buyPage.waitForBuyPageLoaded();

  // Scroll to invest section
  const investSection = buyPage.getInvestSection();
  await investSection.scrollIntoViewIfNeeded();
  await expect(investSection).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify payment method dropdown/selector is visible
  const paymentSelector = buyPage.getPaymentMethodSelector();
  await expect(paymentSelector).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Open the currency selector dropdown
  await paymentSelector.click();
  await page.waitForTimeout(300);

  // Verify FIAT section header is visible
  const fiatHeader = buyPage.getFiatSectionHeader();
  await expect(fiatHeader).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify CRYPTO section header is visible
  const cryptoHeader = buyPage.getCryptoSectionHeader();
  await expect(cryptoHeader).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Select a FIAT currency (e.g., EUR)
  const fiatCurrency = buyPage.getCurrencyOption("EUR");
  await expect(fiatCurrency).toBeVisible({ timeout: TIMEOUTS.SHORT });
  await fiatCurrency.click();
  await page.waitForTimeout(500); // Wait for form update

  // Verify form updates for FIAT payment
  // Check that the selected currency is displayed in the combobox
  const selectedCurrency = await paymentSelector.textContent();
  expect(selectedCurrency).toContain("EUR");

  // Open the dropdown again to select CRYPTO
  await paymentSelector.click();
  await page.waitForTimeout(300);

  // Select a CRYPTO currency (e.g., ETH)
  const cryptoCurrency = buyPage.getCurrencyOption("ETH");
  await expect(cryptoCurrency).toBeVisible({ timeout: TIMEOUTS.SHORT });
  await cryptoCurrency.click();
  await page.waitForTimeout(500); // Wait for form update

  // Verify form updates for CRYPTO payment
  // Check that the selected currency is displayed in the combobox
  const selectedCryptoCurrency = await paymentSelector.textContent();
  expect(selectedCryptoCurrency).toContain("ETH");

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/buy/payment-method-selection.png",
    fullPage: true,
  });
});

