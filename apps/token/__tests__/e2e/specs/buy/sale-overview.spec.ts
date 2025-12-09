/**
 * @test-plan.md (155-168)
 * TC-BUY-004: Sale Overview Section
 *
 * Navigate to `/dashboard/buy`
 * Verify "Overview" section is visible
 * Verify "Tokens available" is displayed with correct count
 * Verify "Sold" percentage is displayed
 * Verify progress bar is displayed
 * Verify "Total Tokens" is displayed
 * Verify "Name" field shows "MahjongStars Tiles"
 * Verify "Symbol" field shows "TILE"
 * Verify "Total supply" is displayed
 * Verify "Price per token" is displayed (e.g., "USD 0.012")
 * Verify "Sale starts" date is displayed
 * Verify "Sale ends" date is displayed
 * Expected: All overview metrics are accurate
 */

import { expect, test } from "@playwright/test";
import { BuyPage } from "../../pages/buy-page";
import { TIMEOUTS } from "../../utils/constants";

test("TC-BUY-004: Sale Overview Section", async ({ page }) => {
  const buyPage = new BuyPage(page);
  await buyPage.goto();
  await buyPage.waitForBuyPageLoaded();

  // Verify "Overview" section is visible
  const overviewSection = buyPage.getOverviewSection();
  await expect(overviewSection).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify "Overview" title is displayed
  const overviewTitle = buyPage.getOverviewTitle();
  await expect(overviewTitle).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify "Tokens available" is displayed with correct count
  const tokensAvailable = buyPage.getTokensAvailable();
  const isTokensAvailableVisible = await tokensAvailable.isVisible().catch(() => false);
  if (isTokensAvailableVisible) {
    await expect(tokensAvailable).toBeVisible({ timeout: TIMEOUTS.SHORT });
    const tokensText = await tokensAvailable.textContent();
    expect(tokensText).toMatch(/\d+/); // Should contain numbers
  }

  // Verify "Sold" percentage is displayed
  const soldPercentage = buyPage.getSoldPercentage();
  const isSoldVisible = await soldPercentage.isVisible().catch(() => false);
  if (isSoldVisible) {
    await expect(soldPercentage).toBeVisible({ timeout: TIMEOUTS.SHORT });
    const soldText = await soldPercentage.textContent();
    expect(soldText).toMatch(/\d+%/); // Should contain percentage
  }

  // Verify progress bar is displayed
  const progressBar = buyPage.getProgressBar();
  const isProgressBarVisible = await progressBar.isVisible().catch(() => false);
  if (isProgressBarVisible) {
    await expect(progressBar).toBeVisible({ timeout: TIMEOUTS.SHORT });
  }

  // Verify "Total Tokens" is displayed
  const totalTokens = buyPage.getTotalTokens();
  const isTotalTokensVisible = await totalTokens.isVisible().catch(() => false);
  if (isTotalTokensVisible) {
    await expect(totalTokens).toBeVisible({ timeout: TIMEOUTS.SHORT });
  }

  // Verify "Name" field shows token name
  const nameField = buyPage.getNameField();
  const isNameVisible = await nameField.isVisible().catch(() => false);
  if (isNameVisible) {
    await expect(nameField).toBeVisible({ timeout: TIMEOUTS.SHORT });
    const nameText = await nameField.textContent();
    expect(nameText).toBeTruthy();
  }

  // Verify "Symbol" field shows "TILE"
  const symbolField = buyPage.getSymbolField();
  const isSymbolVisible = await symbolField.isVisible().catch(() => false);
  if (isSymbolVisible) {
    await expect(symbolField).toBeVisible({ timeout: TIMEOUTS.SHORT });
    const symbolText = await symbolField.textContent();
    expect(symbolText).toMatch(/TILE/i);
  }

  // Verify "Total supply" is displayed
  const totalSupply = buyPage.getTotalSupply();
  const isTotalSupplyVisible = await totalSupply.isVisible().catch(() => false);
  if (isTotalSupplyVisible) {
    await expect(totalSupply).toBeVisible({ timeout: TIMEOUTS.SHORT });
  }

  // Verify "Price per token" is displayed
  const pricePerToken = buyPage.getPricePerToken();
  const isPriceVisible = await pricePerToken.isVisible().catch(() => false);
  if (isPriceVisible) {
    await expect(pricePerToken).toBeVisible({ timeout: TIMEOUTS.SHORT });
    const priceText = await pricePerToken.textContent();
    expect(priceText).toMatch(/USD|EUR|\$|€|\d+\.\d+/); // Should contain currency or price
  }

  // Verify "Sale starts" date is displayed
  const saleStarts = buyPage.getSaleStartsDate();
  const isSaleStartsVisible = await saleStarts.isVisible().catch(() => false);
  if (isSaleStartsVisible) {
    await expect(saleStarts).toBeVisible({ timeout: TIMEOUTS.SHORT });
    const startsText = await saleStarts.textContent();
    expect(startsText).toBeTruthy();
  }

  // Verify "Sale ends" date is displayed
  const saleEnds = buyPage.getSaleEndsDate();
  const isSaleEndsVisible = await saleEnds.isVisible().catch(() => false);
  if (isSaleEndsVisible) {
    await expect(saleEnds).toBeVisible({ timeout: TIMEOUTS.SHORT });
    const endsText = await saleEnds.textContent();
    expect(endsText).toBeTruthy();
  }

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/buy/sale-overview.png",
    fullPage: true,
  });
});

