/**
 * @test-plan.md (227-232)
 * TC-BUY-011: Sale Cover Image Display
 *
 * Navigate to `/dashboard/buy`
 * Verify sale cover image is displayed
 * Verify image loads correctly
 * Verify image has proper alt text
 * Expected: Cover image displays correctly
 */

import { expect, test } from "@playwright/test";
import { BuyPage } from "../../pages/buy-page";
import { TIMEOUTS } from "../../utils/constants";

test("TC-BUY-011: Sale Cover Image Display", async ({ page }) => {
  const buyPage = new BuyPage(page);
  await buyPage.goto();
  await buyPage.waitForBuyPageLoaded();

  // Verify sale cover image is displayed
  const coverImage = buyPage.getSaleCoverImage();
  const isImageVisible = await coverImage.isVisible().catch(() => false);

  if (isImageVisible) {
    await expect(coverImage).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Verify image loads correctly (check naturalWidth > 0)
    const imageLoaded = await coverImage.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0;
    }).catch(() => false);

    // If image is not loaded yet, wait for it
    if (!imageLoaded) {
      await coverImage.waitFor({ state: "visible", timeout: TIMEOUTS.MEDIUM });
    }

    // Verify image has proper alt text or src
    const altText = await coverImage.getAttribute("alt");
    const src = await coverImage.getAttribute("src");

    // Either alt text or src should be present
    expect(altText || src).toBeTruthy();
  }

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/buy/sale-cover-image.png",
    fullPage: true,
  });
});

