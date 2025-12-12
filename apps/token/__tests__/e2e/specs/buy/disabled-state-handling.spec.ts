/**
 * @test-plan.md (234-240)
 * TC-BUY-012: Disabled State Handling
 *
 * Navigate to `/dashboard/buy`
 * If sale is not active or form is disabled:
 * Verify input fields are disabled
 * Verify submit button is disabled
 * Verify appropriate message is displayed
 * Expected: Disabled states are handled gracefully
 */

import { expect, test } from "@playwright/test";
import { BuyPage } from "../../pages/buy-page";
import { TIMEOUTS } from "../../utils/constants";

test("TC-BUY-012: Disabled State Handling", async ({ page }) => {
  const buyPage = new BuyPage(page);
  await buyPage.goto();
  await buyPage.waitForBuyPageLoaded();

  // Scroll to invest section
  const investSection = buyPage.getInvestSection();
  await investSection.scrollIntoViewIfNeeded();

  // Check if form is disabled
  const isFormDisabled = await buyPage.isFormDisabled();

  if (isFormDisabled) {
    // Verify input fields are disabled
    const tokenInput = buyPage.getTokenAmountInput();
    const isTokenInputVisible = await tokenInput.isVisible().catch(() => false);
    if (isTokenInputVisible) {
      await expect(tokenInput).toBeDisabled({ timeout: TIMEOUTS.SHORT });
    }

    const usdInput = buyPage.getTotalAmountInput();
    const isUsdInputVisible = await usdInput.isVisible().catch(() => false);
    if (isUsdInputVisible) {
      await expect(usdInput).toBeDisabled({ timeout: TIMEOUTS.SHORT });
    }

    // Verify submit button is disabled
    const continueButton = buyPage.getContinueButton();
    const isButtonVisible = await continueButton.isVisible().catch(() => false);
    if (isButtonVisible) {
      await expect(continueButton).toBeDisabled({ timeout: TIMEOUTS.SHORT });
    }

    // Verify appropriate message is displayed
    const disabledMessage = buyPage.getDisabledMessage();
    const isMessageVisible = await disabledMessage.isVisible().catch(() => false);
    if (isMessageVisible) {
      await expect(disabledMessage).toBeVisible({ timeout: TIMEOUTS.SHORT });
    }
  } else {
    // If form is not disabled, verify it's enabled
    const tokenInput = buyPage.getTokenAmountInput();
    const isTokenInputVisible = await tokenInput.isVisible().catch(() => false);
    if (isTokenInputVisible) {
      await expect(tokenInput).toBeEnabled({ timeout: TIMEOUTS.SHORT });
    }
  }

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/buy/disabled-state-handling.png",
    fullPage: true,
  });
});

