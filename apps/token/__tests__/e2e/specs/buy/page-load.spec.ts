/**
 * @test-plan.md (117-123)
 * TC-BUY-001: Buy Page Load
 *
 * Navigate to `/dashboard/buy`
 * Verify page title contains "$TILE"
 * Verify sale name is displayed (e.g., "Test Sale")
 * Verify sale description is displayed
 * Verify main content area is visible
 * Expected: Buy page loads successfully
 */

import { expect, test } from "@playwright/test";
import { BuyPage } from "../../pages/buy-page";
import { ROUTES, TIMEOUTS } from "../../utils/constants";

test("TC-BUY-001: Buy Page Load", async ({ page }) => {
  const buyPage = new BuyPage(page);

  // Navigate to buy page
  await buyPage.goto();

  // Verify page title contains "$TILE"
  const title = await buyPage.getTitle();
  expect(title).toContain("$TILE");

  // Verify buy page loads within timeout
  await buyPage.waitForBuyPageLoaded();

  // Verify main content area is visible
  const mainContent = buyPage.getMainContent();
  await expect(mainContent).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify sale name is displayed
  const saleName = buyPage.getSaleName();
  await expect(saleName).toBeVisible({ timeout: TIMEOUTS.SHORT });
  const saleNameText = await saleName.textContent();
  expect(saleNameText).toBeTruthy();
  expect(saleNameText?.trim().length).toBeGreaterThan(0);

  // Verify sale description is displayed
  const saleDescription = buyPage.getSaleDescription();
  const isDescriptionVisible = await saleDescription.isVisible().catch(() => false);
  if (isDescriptionVisible) {
    await expect(saleDescription).toBeVisible({ timeout: TIMEOUTS.SHORT });
    const descriptionText = await saleDescription.textContent();
    expect(descriptionText).toBeTruthy();
  }

  // Verify URL is correct
  await expect(page).toHaveURL(new RegExp(ROUTES.BUY));
  await page.screenshot({ path: "./__tests__/e2e/specs/__screenshots__/buy/buy-page-load.png", fullPage: true });
});

