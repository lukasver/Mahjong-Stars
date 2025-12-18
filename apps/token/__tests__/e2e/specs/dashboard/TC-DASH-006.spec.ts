/**
 * @test-plan.md (60-66)
 * TC-DASH-006: Navigation to Buy Page
 *
 * Navigate to `/dashboard`
 * Click "Buy" link in sidebar navigation
 * Verify URL changes to `/dashboard/buy`
 * Verify buy page loads successfully
 * Expected: Navigation works correctly
 */

import { expect, test } from "@playwright/test";
import { DashboardPage } from "../../pages/dashboard.pom";
import { ROUTES, TIMEOUTS } from "../../utils/constants";

test("TC-DASH-006: Navigation to Buy Page", async ({ page }) => {
	const dashboardPage = new DashboardPage(page);

	// Navigate to dashboard
	await dashboardPage.goto();
	await dashboardPage.waitForDashboardLoaded();

	// Click "Buy" link in sidebar navigation
	await dashboardPage.navigateToBuy();

	// Verify URL changes to `/dashboard/buy`
	await expect(page).toHaveURL(new RegExp(ROUTES.BUY), {
		timeout: TIMEOUTS.MEDIUM,
	});

	// Verify buy page loads successfully
	await expect(page.locator("main")).toBeVisible({ timeout: TIMEOUTS.SHORT });
});
