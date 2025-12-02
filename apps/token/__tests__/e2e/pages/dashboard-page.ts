import { Page } from "@playwright/test";
import { ROUTES, TIMEOUTS } from "../utils/constants";
import { BasePage } from "./base-page";

/**
 * Page Object Model for the Dashboard page
 */
export class DashboardPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}

	/**
	 * Navigate to dashboard
	 */
	async goto(): Promise<void> {
		await super.goto(ROUTES.DASHBOARD);
		await this.waitForLoadState();
	}

	/**
	 * Wait for dashboard to be fully loaded
	 */
	async waitForDashboardLoaded(): Promise<void> {
		// Wait for main dashboard content to be visible
		await this.waitForElement("main", TIMEOUTS.MEDIUM);
	}

	/**
	 * Get token cards container
	 */
	getTokenCards() {
		return this.page
			.locator('[data-testid="token-cards"]')
			.or(
				this.page.locator(
					'div:has-text("Your tokens"), div:has-text("Token Price")',
				),
			);
	}

	/**
	 * Get user tokens card
	 */
	getUserTokensCard() {
		return this.page
			.getByText(/User Tokens|Your Tokens/i)
			.locator("..")
			.first();
	}

	/**
	 * Get token price card
	 */
	getTokenPriceCard() {
		return this.page
			.getByText(/Token Price|Current Price/i)
			.locator("..")
			.first();
	}

	/**
	 * Get fundraising progress section
	 * Returns the first matching selector to avoid strict mode violations
	 */
	async getFundraisingProgress() {
		// Try selectors in order of specificity, return first match
		const selectors = [
			() => this.page.locator('[data-testid="fundraising-progress"]'),
			() => this.page.getByRole("progressbar"),
			() => this.page.locator("progress"),
			() => this.page.locator("div:has(progress)"),
			() => this.page.locator('div:has([role="progressbar"])'),
		];

		for (const selectorFn of selectors) {
			const locator = selectorFn();
			const count = await locator.count();
			if (count > 0) {
				return locator.first();
			}
		}

		// Fallback: return a locator that won't match (for optional checks)
		return this.page.locator('[data-testid="fundraising-progress-not-found"]');
	}

	/**
	 * Get recent transactions section
	 */
	getRecentTransactions() {
		return this.page
			.locator('[data-testid="recent-transactions"]')
			.or(
				this.page
					.getByText(/Recent Transactions|Transaction History/i)
					.locator(".."),
			);
	}

	/**
	 * Navigate to buy page
	 */
	async navigateToBuy(): Promise<void> {
		// Use role-based selector to target the sidebar "Buy" link specifically
		// This avoids matching the header "Buy TILE" button
		const buyLink = this.page.getByRole("link", { name: "Buy", exact: true });
		await buyLink.click({ timeout: TIMEOUTS.MEDIUM });
		await this.waitForURL("**/dashboard/buy", { timeout: TIMEOUTS.MEDIUM });
	}

	/**
	 * Navigate to transactions page
	 */
	async navigateToTransactions(): Promise<void> {
		await this.click('a[href="/dashboard/transactions"]', {
			timeout: TIMEOUTS.MEDIUM,
		});
		await this.waitForURL("**/dashboard/transactions", {
			timeout: TIMEOUTS.MEDIUM,
		});
	}

	/**
	 * Verify dashboard is displayed
	 */
	async verifyDashboardDisplayed(): Promise<void> {
		await this.waitForDashboardLoaded();
		// Check for common dashboard elements
		const hasContent = await this.isPresent("main");
		if (!hasContent) {
			throw new Error("Dashboard content not found");
		}
	}

	/**
	 * Get ICO phases section
	 */
	getIcoPhases() {
		return this.page
			.locator('[data-testid="ico-phases"]')
			.or(this.page.getByText(/ICO Phases|Phases/i).locator(".."));
	}

	/**
	 * Get main content area
	 */
	getMainContent() {
		return this.page.locator("main");
	}

	/**
	 * Get dashboard heading
	 */
	getDashboardHeading() {
		return this.page.getByRole("heading", { name: "Dashboard", level: 1 });
	}

	/**
	 * Get fundraising progress section container
	 */
	getFundraisingProgressSection() {
		return this.page.locator('[data-testid="fundraising-progress"]');
	}

	/**
	 * Get progress bar element
	 */
	getProgressBar() {
		return this.page.getByRole("progressbar").or(this.page.locator("progress"));
	}

	/**
	 * Get sale name from fundraising progress
	 */
	getSaleName() {
		// Sale name is in CardTitle within the fundraising progress section
		return this.page
			.locator('[data-testid="fundraising-progress"]')
			.locator("h1, h2, h3")
			.first();
	}

	/**
	 * Get tokens sold/total tokens text
	 */
	getTokensSoldText() {
		// Look for text containing token counts (e.g., "100,211 / 29,176,667 TILE")
		return this.page
			.locator('[data-testid="fundraising-progress"]')
			.getByText(/\d+.*\/.*\d+.*TILE/i);
	}

	/**
	 * Get progress percentage text
	 */
	getProgressPercentage() {
		// Look for percentage text (e.g., "0%", "50%")
		return this.page
			.locator('[data-testid="fundraising-progress"]')
			.getByText(/\d+%/);
	}

	/**
	 * Get countdown timer text (if active sale)
	 */
	getCountdownTimer() {
		// Look for countdown text (e.g., "Current ICO round ends in 91 days")
		return this.page
			.locator('[data-testid="fundraising-progress"]')
			.getByText(/ends in|remaining|days/i);
	}
}
