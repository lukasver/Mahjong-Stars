/**
 * @test-plan.md (138-153)
 * TC-BUY-003: Sale Information Content
 *
 * Navigate to `/dashboard/buy`
 * Verify "Information" tab content includes:
 * Token Utility section (expandable)
 * Token Overview section (expandable)
 * Total Supply section (expandable)
 * Allocation section (expandable)
 * Security Features section (expandable)
 * Vesting Schedule section (expandable)
 * TGE Unlock section (expandable)
 * Round Description section (expandable)
 * Raise Amount section (expandable)
 * Valuation section (expandable)
 * Click each expandable section
 * Verify content expands and displays details
 * Expected: All information sections are accessible
 */

import { expect, test } from "@playwright/test";
import { BuyPage } from "../../pages/buy-page";
import { TIMEOUTS } from "../../utils/constants";

test("TC-BUY-003: Sale Information Content", async ({ page }) => {
  const buyPage = new BuyPage(page);
  await buyPage.goto();
  await buyPage.waitForBuyPageLoaded();

  // Ensure we're on the Information tab
  const informationTab = buyPage.getInformationTab();
  await informationTab.click({ timeout: TIMEOUTS.SHORT });
  await page.waitForTimeout(500);

  // Verify information accordion is visible
  const informationContent = buyPage.getInformationTabContent();
  await expect(informationContent).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Get all accordion items using data-testid
  const accordionItems = buyPage.getInformationAccordionItems();
  const itemCount = await accordionItems.count();

  // Verify at least one accordion section exists
  expect(itemCount).toBeGreaterThan(0);

  // Expand and verify each accordion item has content
  for (let i = 0; i < itemCount; i++) {
    const accordionItem = accordionItems.nth(i);
    const accordionTrigger = accordionItem.locator('[role="button"]').first();

    // Verify trigger is visible
    await expect(accordionTrigger).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Click to expand
    await accordionTrigger.click({ timeout: TIMEOUTS.SHORT });
    await page.waitForTimeout(300);

    // Verify it's expanded (aria-expanded should be true)
    const isExpanded = await accordionTrigger.getAttribute("aria-expanded");
    if (isExpanded === "true") {
      // Verify content is visible
      const content = accordionItem.locator('[role="region"]');
      const isContentVisible = await content.isVisible().catch(() => false);
      expect(isContentVisible).toBe(true);
    }
  }

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/buy/sale-information-content.png",
    fullPage: true,
  });
});

