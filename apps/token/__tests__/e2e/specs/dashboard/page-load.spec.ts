/**
 * @test-plan.md (13-19)
 * TC-DASH-001: Dashboard Page Load
 *
 * Navigate to `/dashboard`
 * Verify page title contains "$TILE"
 * Verify main content area is visible
 * Verify dashboard heading is displayed
 * Expected: Dashboard loads within 5 seconds
 */

import { expect, test } from "@playwright/test";
import { DashboardPage } from "../../pages/dashboard-page";
import { ROUTES, TIMEOUTS } from "../../utils/constants";

test("TC-DASH-001: Dashboard Page Load", async ({ page }) => {
	const dashboardPage = new DashboardPage(page);

	// Navigate to dashboard
	await dashboardPage.goto();

	// Verify page title contains "$TILE"
	const title = await dashboardPage.getTitle();
	expect(title).toContain("$TILE");

	// Verify dashboard loads within 5 seconds (using timeout)
	await dashboardPage.waitForDashboardLoaded();

	// Verify main content area is visible using POM method
	const mainContent = dashboardPage.getMainContent();
	await expect(mainContent).toBeVisible({ timeout: TIMEOUTS.SHORT });

	// Verify dashboard heading is displayed using POM method
	const dashboardHeading = dashboardPage.getDashboardHeading();
	await expect(dashboardHeading).toBeVisible({ timeout: TIMEOUTS.SHORT });

	// Verify URL is correct
	await expect(page).toHaveURL(new RegExp(ROUTES.DASHBOARD));
});
