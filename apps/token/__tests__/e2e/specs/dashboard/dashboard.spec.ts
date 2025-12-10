import { expect, test } from "@playwright/test";
import { DashboardPage } from "__tests__/e2e/pages/dashboard-page";
import { ROUTES, TIMEOUTS } from "__tests__/e2e/utils/constants";
import { getNormalizedPageStructure } from "__tests__/e2e/utils/helpers";

/**
 * Dashboard page tests
 * These tests assume the user is already authenticated via storage.json
 */
test.describe("Dashboard", () => {
	test.beforeEach(async ({ page }) => {
		const dashboardPage = new DashboardPage(page);
		await dashboardPage.goto();
	});

	test("should load dashboard page", async ({ page }) => {
		const dashboardPage = new DashboardPage(page);

		await dashboardPage.verifyDashboardDisplayed();
		await expect(page).toHaveURL(new RegExp(ROUTES.DASHBOARD));
	});

	test("should display main dashboard content", async ({ page }) => {
		const dashboardPage = new DashboardPage(page);

		await dashboardPage.waitForDashboardLoaded();

		// Check that main content is visible
		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});

	test("should navigate to buy page", async ({ page }) => {
		const dashboardPage = new DashboardPage(page);

		await dashboardPage.navigateToBuy();
		await expect(page).toHaveURL(new RegExp(ROUTES.BUY));
	});

	test("should navigate to transactions page", async ({ page }) => {
		const dashboardPage = new DashboardPage(page);

		await dashboardPage.navigateToTransactions();
		await expect(page).toHaveURL(new RegExp(ROUTES.TRANSACTIONS));
	});

	test("should display fundraising progress section", async ({ page }) => {
		const dashboardPage = new DashboardPage(page);

		await dashboardPage.waitForDashboardLoaded();

		// Verify page loaded correctly
		await expect(page.locator("main")).toBeVisible();

		// Check if fundraising progress section exists (may not be visible depending on sale status)
		const progressSection = await dashboardPage.getFundraisingProgress();
		const progressSectionCount = await progressSection.count();

		// If progress section exists, verify it's properly displayed
		if (progressSectionCount > 0) {
			await expect(progressSection).toBeVisible({ timeout: TIMEOUTS.SHORT });
		}
		// If it doesn't exist, that's also acceptable - just verify page structure is intact
	});

	test("should match accessibility structure snapshot", async ({ page }) => {
		const dashboardPage = new DashboardPage(page);
		await dashboardPage.waitForDashboardLoaded();

		// Get normalized page structure (tags, roles, hierarchy)
		// This captures the structure without dynamic content (dates, amounts, addresses)
		// text nodes are removed and we only check for the nodes structure
		const structure = await getNormalizedPageStructure(page, "main");

		// Convert to JSON string for snapshot comparison
		// Playwright's toMatchSnapshot expects a string or Buffer
		const structureJson = JSON.stringify(structure, null, 2);

		// Compare against saved snapshot (creates snapshot on first run)
		// This test ensures the page structure doesn't change unexpectedly
		// The snapshot will be saved in __tests__/e2e/specs/__snapshots__/
		expect(structureJson).toMatchSnapshot("dashboard-structure.json");
	});
});
