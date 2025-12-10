/**
 * @test-plan.md (138-153)
 * TC-BUY-003: Sale Information Content
 *
 * Navigate to `/dashboard/buy`
 * Verify "Information" tab content includes accordion with expandable sections
 * Verify accordion is visible and contains at least one accordion item
 * For each accordion item:
 * - Verify accordion trigger button is present and attached to DOM
 * - Click to expand/collapse the section
 * - Verify accordion state changes correctly (aria-expanded attribute)
 * - Verify content region exists for each accordion item
 * - If expanded, verify content is visible
 * Expected: All information sections are accessible and expandable/collapsible
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

  // Find all accordion trigger buttons directly within the accordion
  // Buttons are always in the DOM, even when accordion items are collapsed
  // Note: buttons don't have role="button" attribute, so we select h3 > button
  const accordionTriggers = informationContent.locator('h3 > button');

  // Wait for at least one button to be attached (accordion is loaded)
  await expect(accordionTriggers.first()).toBeAttached({ timeout: TIMEOUTS.SHORT });

  const triggerCount = await accordionTriggers.count();
  expect(triggerCount).toBeGreaterThan(0);

  // Get all accordion items for content verification
  const accordionItems = buyPage.getInformationAccordionItems();
  const itemCount = await accordionItems.count();
  expect(itemCount).toBe(triggerCount);

  // Expand and verify each accordion item has content
  for (let i = 0; i < triggerCount; i++) {
    const accordionTrigger = accordionTriggers.nth(i);
    const accordionItem = accordionItems.nth(i);

    // Verify trigger is attached (buttons are always in DOM, even when collapsed)
    await expect(accordionTrigger).toBeAttached({ timeout: TIMEOUTS.SHORT });

    // Get the current expanded state before clicking
    const wasExpanded = (await accordionTrigger.getAttribute("aria-expanded")) === "true";

    // Click to toggle (expand if collapsed, or verify it's already expanded)
    await accordionTrigger.click({ timeout: TIMEOUTS.SHORT });
    await page.waitForTimeout(300);

    // Verify state after click
    const isExpanded = (await accordionTrigger.getAttribute("aria-expanded")) === "true";

    // If it was collapsed, it should now be expanded
    // If it was already expanded, clicking might collapse it, but we'll verify content exists
    if (!wasExpanded) {
      expect(isExpanded).toBe(true);
    }

    // Verify content region exists (check attachment, not visibility, since collapsed items hide content)
    const content = accordionItem.locator('[role="region"]');
    const contentCount = await content.count();
    expect(contentCount).toBeGreaterThan(0);

    // If expanded, verify content is visible
    if (isExpanded) {
      await expect(content.first()).toBeVisible({ timeout: TIMEOUTS.SHORT });
    }
  }

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/buy/sale-information-content.png",
    fullPage: true,
  });
});

