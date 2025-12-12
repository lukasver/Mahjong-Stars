/**
 * @test-plan.md (209-216)
 * TC-BUY-009: Invest Form Submission (FIAT)
 *
 * Navigate to `/dashboard/buy`
 * Select "FIAT" payment method
 * Enter valid token amount (e.g., 1000 TILE)
 * Verify USD amount is calculated correctly
 * Click "Continue" or "Invest" button
 * Verify navigation to transaction page (`/dashboard/buy/[tx]`)
 * Expected: FIAT purchase flow initiates correctly
 */

import { invariant } from "@epic-web/invariant";
import { faker } from "@faker-js/faker";
import { formatValue } from "@mjs/ui/primitives/form-input/currency-input";
import { expect, test } from "@playwright/test";
import { mockExchangeRates } from "__tests__/mocks/helpers";
import Decimal from "decimal.js";
import { FIAT_CURRENCIES } from "@/common/config/constants";
import { SaleInvestInfo } from "@/common/types/sales";
import { AmountCalculatorService } from "@/lib/services/pricefeeds/amount.service";
import { BuyPage } from "../../pages/buy-page";
import { TIMEOUTS } from "../../utils/constants";

async function getExchangeRate() {
  return { data: mockExchangeRates, error: null };
}

const service = new AmountCalculatorService(getExchangeRate);

invariant(service, "Amount calculator service is required");

test.describe.serial("Invest Form Submission ", () => {
  test.beforeEach(async ({ page, context }) => {
    // Intercept all requests to the exchange rates endpoint, regardless of query parameters
    // This matches requests like: /api/proxy/feeds/rates?from=USD&to=ETH
    await context.route(
      (url) => url.pathname.includes("/api/proxy/feeds/rates"),
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: mockExchangeRates,
            status: 200,
          }),
        });
      },
    );
    const buyPage = new BuyPage(page);
    await buyPage.cancelExistingTransactionIfExists();
  });

  test("TC-BUY-009: Invest Form Submission (FIAT)", async ({ page }) => {
    const buyPage = new BuyPage(page);

    // If you want to wait for a response that happens during page load,
    // set up the promise BEFORE goto() (Note: no await on the promise)
    // Example: waiting for sale data to load
    const saleDataResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/proxy/sales") &&
        response.url().endsWith("/invest") &&
        response.status() === 200 &&
        response.request().method() === "GET",
    );

    await buyPage.goto();
    await buyPage.waitForBuyPageLoaded();

    // Now await the promise to get the response
    const saleDataResponse = await saleDataResponsePromise;
    const saleData: {
      success: boolean;
      data: SaleInvestInfo;
      status: number;
    } = await saleDataResponse.json();

    expect(saleData).toBeTruthy();

    invariant(saleData?.data, "Sale data is required");

    // Scroll to invest section
    const investSection = buyPage.getInvestSection();

    await investSection.scrollIntoViewIfNeeded();
    await expect(investSection).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Check if form is disabled - if so, skip the test
    const isFormDisabled = await buyPage.isFormDisabled();
    if (isFormDisabled) {
      // Form is disabled (e.g., sale has ended), skip this test
      return;
    }

    // Select "FIAT" payment method (EUR as example)
    const paymentSelector = buyPage.getPaymentMethodSelector();
    await expect(paymentSelector).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Open the dropdown
    await paymentSelector.click();
    await page.waitForTimeout(300); // Wait for dropdown to open

    // Verify FIAT section header is visible
    const fiatHeader = buyPage.getFiatSectionHeader();
    await expect(fiatHeader).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Select EUR (FIAT currency)
    const eurOption = buyPage.getCurrencyOption("EUR");
    await expect(eurOption).toBeVisible({ timeout: TIMEOUTS.SHORT });
    await eurOption.click({ timeout: TIMEOUTS.SHORT });
    await page.waitForTimeout(500); // Wait for form update

    // Verify EUR is now displayed in the combobox
    await expect(paymentSelector).toHaveText(/EUR/i, {
      timeout: TIMEOUTS.SHORT,
    });

    await paymentSelector.click();
    const usdOption = buyPage.getCurrencyOption("USD");
    await expect(usdOption).toBeVisible({ timeout: TIMEOUTS.SHORT });
    //Go back to USD so we can test the USD amount calculation
    await usdOption.click({ timeout: TIMEOUTS.SHORT });
    await page.waitForTimeout(500); // Wait for form update
    await expect(paymentSelector).toHaveText(/USD/i, {
      timeout: TIMEOUTS.SHORT,
    });

    // Enter valid token amount
    const tokenInput = buyPage.getTokenAmountInput();
    await expect(tokenInput).toBeVisible({ timeout: TIMEOUTS.SHORT });
    const maxBuyPerUser = Number(saleData.data.sale.maximumTokenBuyPerUser);
    const maxQ = Math.min(
      Number(saleData.data.sale.availableTokenQuantity),
      maxBuyPerUser || 10000,
    );
    const quantity = `${faker.number.int({ min: 1, max: maxQ })}`;
    await tokenInput.fill(quantity);
    await page.waitForTimeout(300); // Wait for USD calculation

    // Verify USD amount is calculated correctly
    const usdInput = buyPage.getTotalAmountInput();
    await expect(usdInput).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Make sure math checks with amount and fees
    const pricePerToken = await buyPage.getPricePerToken();
    const pricePerTokenText = await pricePerToken.textContent();
    expect(pricePerTokenText).toBeTruthy();
    invariant(pricePerTokenText, "Price per token is required");
    const ppu = pricePerTokenText.split(" ")[1];
    expect(ppu).toBeTruthy();
    invariant(ppu, "Price per token is required");

    // Math checks from inputs and visible information
    const decimalPPU = new Decimal(ppu);
    const usdValue = await usdInput.inputValue();
    const usdNumericValue = usdValue.replace(/[^0-9.]/g, "");
    const decimalValue = new Decimal(usdNumericValue);
    expect(usdValue).toBeTruthy();
    expect(parseFloat(usdNumericValue)).toBeGreaterThan(0);
    expect(decimalValue.toDecimalPlaces().toString()).toBe(
      // We use 2 here because frontend shows 2 decimal places for FIAT currencies.
      decimalPPU
        .mul(new Decimal(quantity))
        .toDecimalPlaces()
        .toFixed(2, Decimal.ROUND_DOWN),
    );

    // Math check from internal calculations. Ensure the total amount to pay is calculated correctly
    const shouldAddFee = !Number.isNaN(
      Number(process.env.NEXT_PUBLIC_FEE_BPS),
    );
    const { amount, fees } = service.getTotalAmount({
      pricePerUnit: decimalPPU,
      quantity: quantity,
      addFee: shouldAddFee,
    });

    expect(new Decimal(amount).isZero()).toBe(false);
    expect(new Decimal(fees).isZero()).toBe(shouldAddFee);

    // The value should be the same as the result of the calculation service.
    expect(decimalValue.toDecimalPlaces().toString()).toBe(
      getInputTrimmedValue(amount, saleData.data.sale.currency)
    );

    // Verify "Continue" or "Invest" button is visible and enabled
    const continueButton = buyPage.getContinueButton();
    await expect(continueButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
    await expect(continueButton).toBeEnabled({ timeout: TIMEOUTS.SHORT });

    // Click the button to trigger the confirmation modal
    await continueButton.click({ timeout: TIMEOUTS.MEDIUM });

    // Wait for the summary modal to appear
    const summaryModal = buyPage.getSummaryModal();
    const summaryDetails = buyPage.getSummaryModalDetails();
    const paymentMethodSection = buyPage.getSummaryModalPaymentMethod();

    await Promise.all([
      expect(summaryModal).toBeVisible({ timeout: TIMEOUTS.MEDIUM }),
      // Verify modal details section is visible
      expect(summaryDetails).toBeVisible({ timeout: TIMEOUTS.SHORT }),
      // Verify payment method section is visible
      expect(paymentMethodSection).toBeVisible({ timeout: TIMEOUTS.SHORT }),
    ]);

    // Check KYC indicator visibility based on sale data
    const kycIndicator = buyPage.getSummaryKYCRequiredIndicator();
    if (saleData.data.sale.requiresKYC) {
      await expect(kycIndicator).toBeVisible({ timeout: TIMEOUTS.SHORT });
      const kycText = await kycIndicator.textContent();
      expect(kycText).toContain("KYC Required");
    } else {
      // If KYC is not required, the indicator should not be present
      const kycCount = await kycIndicator.count();
      expect(kycCount).toBe(0);
    }

    // Check SAFT indicator visibility based on sale data
    const saftIndicator = buyPage.getSummarySAFTRequiredIndicator();
    if (saleData.data.sale.saftCheckbox) {
      await expect(saftIndicator).toBeVisible({ timeout: TIMEOUTS.SHORT });
      const saftText = await saftIndicator.textContent();
      expect(saftText).toContain("SAFT Agreement");
    } else {
      // If SAFT is not required, the indicator should not be present
      const saftCount = await saftIndicator.count();
      expect(saftCount).toBe(0);
    }

    // Verify modal action buttons are visible
    const cancelButton = buyPage.getSummaryModalCancelButton();
    await Promise.all([
      expect(cancelButton).toBeVisible({ timeout: TIMEOUTS.SHORT }),
      expect(cancelButton).toBeEnabled({ timeout: TIMEOUTS.SHORT }),
    ]);

    const continueModalButton = buyPage.getSummaryModalContinueButton();
    await Promise.all([
      expect(continueModalButton).toBeVisible({ timeout: TIMEOUTS.SHORT }),
      expect(continueModalButton).toBeEnabled({ timeout: TIMEOUTS.SHORT }),
    ]);

    // Close the modal by clicking cancel (to avoid creating a transaction)
    await cancelButton.click({ timeout: TIMEOUTS.SHORT });
    await expect(summaryModal).not.toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Open again
    // Click the button to trigger the confirmation modal
    await continueButton.click({ timeout: TIMEOUTS.MEDIUM });
    await Promise.all([
      expect(continueModalButton).toBeVisible({ timeout: TIMEOUTS.SHORT }),
      expect(continueModalButton).toBeEnabled({ timeout: TIMEOUTS.SHORT }),
    ]);

    // Set up the route interceptor BEFORE clicking
    await buyPage.interceptBuyRequest();

    // Set up promise to wait for the POST response
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/dashboard/buy") &&
        response.status() === 200 &&
        response.request().method() === "POST",
      { timeout: TIMEOUTS.MEDIUM },
    );

    // Click the button to submit
    await continueModalButton.click({ timeout: TIMEOUTS.MEDIUM });

    // Wait for the response to complete first
    await responsePromise;

    // Wait for modal to close (indicates navigation started)
    await expect(summaryModal).not.toBeVisible({ timeout: TIMEOUTS.MEDIUM });

    // Then wait for the URL to change (client-side navigation via router.push)
    // Use a loop to check URL since client-side navigation might not trigger navigation event
    await page.waitForFunction(
      () => {
        return window.location.pathname.match(/\/dashboard\/buy\/[^/]+$/);
      },
      { timeout: TIMEOUTS.LONG },
    );

    // Verify the URL matches the expected pattern
    expect(page.url()).toMatch(/\/dashboard\/buy\/[^/]+$/);

    await page.screenshot({
      path: "./__tests__/e2e/specs/__screenshots__/buy/form-submission-fiat.png",
      fullPage: true,
    });
  });

  test("TC-BUY-010: Invest Form Submission (CRYPTO)", async ({ page }) => {
    const buyPage = new BuyPage(page);

    // If you want to wait for a response that happens during page load,
    // set up the promise BEFORE goto() (Note: no await on the promise)
    // Example: waiting for sale data to load
    const saleDataResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/proxy/sales") &&
        response.url().endsWith("/invest") &&
        response.status() === 200 &&
        response.request().method() === "GET",
    );

    await buyPage.goto();
    await buyPage.waitForBuyPageLoaded();

    // Now await the promise to get the response
    const saleDataResponse = await saleDataResponsePromise;
    const saleData: {
      success: boolean;
      data: SaleInvestInfo;
      status: number;
    } = await saleDataResponse.json();

    expect(saleData).toBeTruthy();

    invariant(saleData?.data, "Sale data is required");

    // Scroll to invest section
    const investSection = buyPage.getInvestSection();

    await investSection.scrollIntoViewIfNeeded();
    await expect(investSection).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Check if form is disabled - if so, skip the test
    const isFormDisabled = await buyPage.isFormDisabled();
    if (isFormDisabled) {
      // Form is disabled (e.g., sale has ended), skip this test
      return;
    }

    // Select "CRYPTO" payment method (BTC as example)
    const paymentSelector = buyPage.getPaymentMethodSelector();
    await expect(paymentSelector).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Open the dropdown
    await paymentSelector.click();
    await page.waitForTimeout(300); // Wait for dropdown to open

    // Verify CRYPTO section header is visible
    const cryptoHeader = buyPage.getCryptoSectionHeader();
    await expect(cryptoHeader).toBeVisible({ timeout: TIMEOUTS.SHORT });

    const PURCHASE_CRYPTO_CURRENCY = "ETH";
    // Select ETH (CRYPTO currency)
    const btcOption = buyPage.getCurrencyOption(PURCHASE_CRYPTO_CURRENCY);
    await expect(btcOption).toBeVisible({ timeout: TIMEOUTS.SHORT });
    await btcOption.click({ timeout: TIMEOUTS.SHORT });
    await page.waitForTimeout(500); // Wait for form update

    // Verify ETH is now displayed in the combobox
    await expect(paymentSelector).toHaveText(
      new RegExp(`^${PURCHASE_CRYPTO_CURRENCY}$`, "i"),
      {
        timeout: TIMEOUTS.SHORT,
      },
    );

    // Enter valid token amount
    const tokenInput = buyPage.getTokenAmountInput();
    await expect(tokenInput).toBeVisible({ timeout: TIMEOUTS.SHORT });
    const maxBuyPerUser = Number(saleData.data.sale.maximumTokenBuyPerUser);
    const maxQ = Math.min(
      Number(saleData.data.sale.availableTokenQuantity),
      maxBuyPerUser || 10000,
    );
    const quantity = `${faker.number.int({ min: 1, max: maxQ })}`;
    await tokenInput.fill(quantity);
    await page.waitForTimeout(1000); // Wait for crypto calculation

    // Verify crypto amount is calculated correctly
    // The form should show the crypto amount in the "To pay" field
    const cryptoInput = buyPage.getTotalAmountInput();
    await expect(cryptoInput).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Verify the crypto amount is displayed and is greater than 0
    const cryptoValue = await cryptoInput.inputValue();

    const cryptoNumericValue = cryptoValue.replace(/[^0-9.]/g, "");
    expect(cryptoValue).toBeTruthy();
    expect(parseFloat(cryptoNumericValue)).toBeGreaterThan(0);

    // Verify "Continue" or "Invest" button is visible and enabled
    const continueButton = buyPage.getContinueButton();
    await expect(continueButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
    await expect(continueButton).toBeEnabled({ timeout: TIMEOUTS.SHORT });

    // Click the button to trigger the confirmation modal
    await continueButton.click({ timeout: TIMEOUTS.MEDIUM });

    // Wait for the summary modal to appear
    const summaryModal = buyPage.getSummaryModal();
    const summaryDetails = buyPage.getSummaryModalDetails();

    await Promise.all([
      expect(summaryModal).toBeVisible({ timeout: TIMEOUTS.MEDIUM }),
      // Verify modal details section is visible
      expect(summaryDetails).toBeVisible({ timeout: TIMEOUTS.SHORT }),
    ]);

    // Math check from internal calculations. Ensure the total amount to pay is calculated correctly
    const shouldAddFee = !Number.isNaN(
      Number(process.env.NEXT_PUBLIC_FEE_BPS),
    );

    const conversion = await service.convertToCurrency({
      amount: new Decimal(quantity)
        .mul(saleData.data.sale.tokenPricePerUnit)
        .toDecimalPlaces()
        .toString(),
      fromCurrency: saleData.data.sale.currency,
      toCurrency: PURCHASE_CRYPTO_CURRENCY,
      precision: 8,
    });

    const newPPU = new Decimal(conversion.exchangeRate)
      .mul(saleData.data.sale.tokenPricePerUnit)
      .toDecimalPlaces()
      .toString();

    const inputCryptoDecimalAmount = new Decimal(cryptoNumericValue);

    const { amount, fees } = service.getTotalAmount({
      pricePerUnit: newPPU,
      quantity: quantity,
      addFee: shouldAddFee,
      precision: 8,
    });

    expect(new Decimal(amount).isZero()).toBe(false);
    expect(new Decimal(fees).isZero()).toBe(shouldAddFee);

    console.debug(
      "Q HAY ACA???",
      getInputTrimmedValue(conversion.amount, PURCHASE_CRYPTO_CURRENCY)
    );

    // The value should be the same as the result of the calculation service.
    expect(inputCryptoDecimalAmount.toString()).toBe(
      // Input shows a maximum of 8 decimal places for crypto currencies.
      // new Decimal(conversion.amount).toDecimalPlaces(8).toString(),
      getInputTrimmedValue(conversion.amount, PURCHASE_CRYPTO_CURRENCY)
    );

    // Check KYC indicator visibility based on sale data
    const kycIndicator = buyPage.getSummaryKYCRequiredIndicator();
    if (saleData.data.sale.requiresKYC) {
      await expect(kycIndicator).toBeVisible({ timeout: TIMEOUTS.SHORT });
      const kycText = await kycIndicator.textContent();
      expect(kycText).toContain("KYC Required");
    } else {
      // If KYC is not required, the indicator should not be present
      const kycCount = await kycIndicator.count();
      expect(kycCount).toBe(0);
    }

    // Check SAFT indicator visibility based on sale data
    const saftIndicator = buyPage.getSummarySAFTRequiredIndicator();
    if (saleData.data.sale.saftCheckbox) {
      await expect(saftIndicator).toBeVisible({ timeout: TIMEOUTS.SHORT });
      const saftText = await saftIndicator.textContent();
      expect(saftText).toContain("SAFT Agreement");
    } else {
      // If SAFT is not required, the indicator should not be present
      const saftCount = await saftIndicator.count();
      expect(saftCount).toBe(0);
    }

    const continueModalButton = buyPage.getSummaryModalContinueButton();
    await Promise.all([
      expect(continueModalButton).toBeVisible({ timeout: TIMEOUTS.SHORT }),
      expect(continueModalButton).toBeEnabled({ timeout: TIMEOUTS.SHORT }),
    ]);

    // Set up the route interceptor BEFORE clicking
    await buyPage.interceptBuyRequest();
    // Set up promise to wait for the POST response
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/dashboard/buy") &&
        response.status() === 200 &&
        response.request().method() === "POST",
      { timeout: TIMEOUTS.MEDIUM },
    );

    // Click the button to submit
    await continueModalButton.click({ timeout: TIMEOUTS.MEDIUM });

    // Wait for the response to complete first
    await responsePromise;

    // Wait for modal to close (indicates navigation started)
    await expect(summaryModal).not.toBeVisible({ timeout: TIMEOUTS.MEDIUM });

    // Then wait for the URL to change (client-side navigation via router.push)
    // Use a loop to check URL since client-side navigation might not trigger navigation event
    await page.waitForFunction(
      () => {
        return window.location.pathname.match(/\/dashboard\/buy\/[^/]+$/);
      },
      { timeout: TIMEOUTS.LONG },
    );

    // Verify the URL matches the expected pattern
    expect(page.url()).toMatch(/\/dashboard\/buy\/[^/]+$/);

    await page.screenshot({
      path: "./__tests__/e2e/specs/__screenshots__/buy/form-submission-crypto.png",
      fullPage: true,
    });
  });
});

const getDefaultIntlConfig = (currency: string) =>
  ({
    locale: faker.helpers.arrayElement([
      "en-US",
      "de-DE",
      "fr-FR",
      "es-ES",
      "it-IT",
      "ja-JP",
      "ko-KR",
      "zh-CN",
      "zh-TW",
    ]),
    currency,
    maximumFractionDigits: FIAT_CURRENCIES.includes(currency) ? 2 : 8,
    minimumFractionDigits: 3,
  }) satisfies Parameters<typeof formatValue>[0]["intlConfig"];



/**
 * Currenty Currency input configuration trims the value to be displayed in the input
 * to the decimalScale value. This helper function is needed to ensure same comparison
 */
function getInputTrimmedValue(
  amount: string,
  currency: string,
  opts?: Partial<Omit<Parameters<typeof formatValue>[0], "value">>,
) {

  const decimalScale = FIAT_CURRENCIES.includes(currency) ? 2 : 8;

  const { intlConfig = getDefaultIntlConfig(currency) } = opts || {};

  const formattedValue = formatValue({
    value: amount,
    decimalScale,
    intlConfig,
  });


  // Parse the formatted value using locale-aware parsing
  const locale = intlConfig.locale || "en-US";

  const cleanNumericValue = parseFormattedCurrencyValue(
    formattedValue,
    locale,
    currency,
  );

  return Number(cleanNumericValue).toFixed(decimalScale);

}


/**
 * Parses a formatted currency value to a numeric string, handling locale-specific
 * decimal and group separators correctly.
 * 
 * @param formattedValue - The formatted currency string (e.g., "1.234,56" or "1,234.56")
 * @param locale - The locale string (e.g., "en-US", "de-DE")
 * @param currency - The currency code (e.g., "USD", "EUR")
 * @returns Clean numeric string with dot as decimal separator
 */
function parseFormattedCurrencyValue(
  formattedValue: string,
  locale: string,
  currency: string,
): string {
  // Get the format parts to understand the locale's number formatting
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).formatToParts(12345.67);

  // Extract the decimal and group separators used in this locale
  const decimalSeparator =
    parts.find((part) => part.type === "decimal")?.value || ".";
  const groupSeparator =
    parts.find((part) => part.type === "group")?.value || ",";

  // Remove currency symbols, letters, and spaces
  let cleanValue = formattedValue
    .replace(/[^0-9\-,.\s]/g, "") // Remove currency symbols and letters
    .replace(/\s/g, ""); // Remove spaces

  // Remove group separators (thousands separators)
  if (groupSeparator) {
    cleanValue = cleanValue.replace(
      new RegExp(`\\${groupSeparator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"),
      "",
    );
  }

  // Replace the locale-specific decimal separator with a period
  if (decimalSeparator !== ".") {
    cleanValue = cleanValue.replace(
      new RegExp(`\\${decimalSeparator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"),
      ".",
    );
  }

  return cleanValue;
}
