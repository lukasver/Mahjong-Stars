/**
 * @test-plan.md (67-73)
 * TC-DASH-007: Navigation to Transactions Page
 *
 * Navigate to `/dashboard`
 * Click "Transactions" link in sidebar navigation
 * Verify URL changes to `/dashboard/transactions`
 * Verify transactions page loads successfully
 * Expected: Navigation works correctly
 */

import { expect, test } from "@playwright/test";
import { DashboardPage } from "../../pages/dashboard.pom";
import { ROUTES, TIMEOUTS } from "../../utils/constants";

test("TC-DASH-007: Navigation to Transactions Page", async ({ page }) => {
	const dashboardPage = new DashboardPage(page);

	// Navigate to dashboard
	await dashboardPage.goto();
	await dashboardPage.waitForDashboardLoaded();

	// Click "Transactions" link in sidebar navigation
	await dashboardPage.navigateToTransactions();

	// Verify URL changes to `/dashboard/transactions`
	await expect(page).toHaveURL(new RegExp(ROUTES.TRANSACTIONS), {
		timeout: TIMEOUTS.MEDIUM,
	});

	// Verify transactions page loads successfully
	await expect(page.locator("main")).toBeVisible({ timeout: TIMEOUTS.SHORT });
});
