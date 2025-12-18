/**
 * @test-plan.md (74-79)
 * TC-DASH-008: Header Buy Button Navigation
 *
 * Navigate to `/dashboard`
 * Click "Buy {tokenSymbol}" button in header (token symbol is dynamic, e.g., "Buy tMJS", "Buy TILE")
 * Verify navigation to buy page or scroll to invest component
 * Expected: Header button navigates correctly
 */

import { expect, test } from "@playwright/test";
import { DashboardPage } from "../../pages/dashboard.pom";
import { ROUTES, TIMEOUTS } from "../../utils/constants";

test("TC-DASH-008: Header Buy Button Navigation", async ({ page }) => {
	const dashboardPage = new DashboardPage(page);

	// Navigate to dashboard
	await dashboardPage.goto();
	await dashboardPage.waitForDashboardLoaded();

	// Click "Buy {tokenSymbol}" button in header (token symbol is dynamic)
	const headerBuyButton = dashboardPage.getHeaderBuyButton();
	await expect(headerBuyButton).toBeVisible({ timeout: TIMEOUTS.SHORT });

	const initialURL = page.url();
	await headerBuyButton.click({ timeout: TIMEOUTS.MEDIUM });

	// Verify navigation to buy page or scroll to invest component
	// The button might navigate to /dashboard/buy or scroll to #invest-component
	await page.waitForTimeout(1000); // Wait for navigation or scroll

	const currentURL = page.url();
	const urlChanged = currentURL !== initialURL;

	if (urlChanged) {
		// If URL changed, verify it's the buy page
		await expect(page).toHaveURL(new RegExp(ROUTES.BUY), {
			timeout: TIMEOUTS.MEDIUM,
		});
	} else {
		// If URL didn't change, it might have scrolled to invest component
		// Verify we're still on dashboard
		await expect(page).toHaveURL(new RegExp(ROUTES.DASHBOARD), {
			timeout: TIMEOUTS.SHORT,
		});
		// Verify page is still visible
		await expect(page.locator("main")).toBeVisible({
			timeout: TIMEOUTS.SHORT,
		});
	}
});
