/**
 * @test-plan.md (125-136)
 * TC-BUY-002: Sale Information Tabs
 *
 * Navigate to `/dashboard/buy`
 * Verify "Information" tab is selected by default
 * Verify "Documents" tab is visible with count (e.g., "Documents (0)")
 * Verify "Gallery" tab is visible with count (e.g., "Gallery (0)")
 * Click "Documents" tab
 * Verify documents content is displayed
 * Click "Gallery" tab
 * Verify gallery content is displayed
 * Click "Information" tab
 * Verify information content is displayed
 * Expected: All tabs function correctly
 */

import { expect, test } from "@playwright/test";
import { BuyPage } from "../../pages/buy-page";
import { TIMEOUTS } from "../../utils/constants";

test("TC-BUY-002: Sale Information Tabs", async ({ page }) => {
  const buyPage = new BuyPage(page);
  await buyPage.goto();
  await buyPage.waitForBuyPageLoaded();

  // Verify "Information" tab is selected by default
  const informationTab = buyPage.getInformationTab();
  await expect(informationTab).toBeVisible({ timeout: TIMEOUTS.SHORT });
  const isInformationSelected = await informationTab.getAttribute("data-state");
  expect(isInformationSelected).toBe("active");

  // Verify "Documents" tab is visible with count
  const documentsTab = buyPage.getDocumentsTab();
  await expect(documentsTab).toBeVisible({ timeout: TIMEOUTS.SHORT });
  const documentsTabText = await documentsTab.textContent();
  expect(documentsTabText).toMatch(/Documents\s*\(\d+\)/i);

  // Verify "Gallery" tab is visible with count
  const galleryTab = buyPage.getGalleryTab();
  await expect(galleryTab).toBeVisible({ timeout: TIMEOUTS.SHORT });
  const galleryTabText = await galleryTab.textContent();
  expect(galleryTabText).toMatch(/Gallery\s*\(\d+\)/i);

  // Click "Documents" tab
  await documentsTab.click({ timeout: TIMEOUTS.SHORT });
  await page.waitForTimeout(500); // Wait for tab switch

  // Verify documents content is displayed (either documents list or placeholder)
  const documentsContent = buyPage.getDocumentsTabContent();
  await expect(documentsContent).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Check if it's the placeholder or actual content
  const documentsTabContent = page.locator('[data-testid="documents-tab-content"]');
  const documentsTabContentCount = await documentsTabContent.count();
  if (documentsTabContentCount > 0) {
    // Verify documents are listed
    await expect(documentsTabContent).toBeVisible({ timeout: TIMEOUTS.SHORT });
    const documentCards = documentsTabContent.locator('a, [class*="card"]');
    const documentCount = await documentCards.count();
    expect(documentCount).toBeGreaterThan(0);
  } else {
    // Verify placeholder is shown
    const placeholderText = await documentsContent.textContent();
    expect(placeholderText).toMatch(/No documents found/i);
  }

  // Click "Gallery" tab
  await galleryTab.click({ timeout: TIMEOUTS.SHORT });
  await page.waitForTimeout(500); // Wait for tab switch

  // Verify gallery content is displayed (either images or placeholder)
  const galleryContent = buyPage.getGalleryTabContent();
  await expect(galleryContent).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Check if it's the placeholder or actual content
  const galleryTabContent = page.locator('[data-testid="gallery-tab-content"]');
  const galleryTabContentCount = await galleryTabContent.count();
  if (galleryTabContentCount > 0) {
    // Verify images are displayed
    await expect(galleryTabContent).toBeVisible({ timeout: TIMEOUTS.SHORT });
    const images = galleryTabContent.locator('img');
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThan(0);
  } else {
    // Verify placeholder is shown
    const placeholderText = await galleryContent.textContent();
    expect(placeholderText).toMatch(/No images found/i);
  }

  // Click "Information" tab
  await informationTab.click({ timeout: TIMEOUTS.SHORT });
  await page.waitForTimeout(500); // Wait for tab switch

  // Verify information content is displayed (accordion with items)
  const informationContent = buyPage.getInformationTabContent();
  await expect(informationContent).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify accordion has at least one item
  const accordionItems = buyPage.getInformationAccordionItems();
  const itemCount = await accordionItems.count();
  expect(itemCount).toBeGreaterThan(0);

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/buy/sale-information-tabs.png",
    fullPage: true,
  });
});

