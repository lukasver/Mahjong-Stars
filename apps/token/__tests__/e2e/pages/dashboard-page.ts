import { Locator, Page } from "@playwright/test";
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
		return this.page.locator('[data-testid="token-cards"]');
	}

	/**
	 * Get "Your tokens" card
	 */
	getYourTokensCard() {
		return this.page
			.locator('[data-testid="token-cards"]')
			.getByText("Your tokens")
			.locator("..");
	}

	/**
	 * Get "Tokens pending confirmation" card
	 */
	getTokensPendingConfirmationCard() {
		return this.page
			.locator('[data-testid="token-cards"]')
			.getByText("Tokens pending confirmation")
			.locator("..");
	}

	/**
	 * Get "Token Price" card
	 */
	getTokenPriceCard() {
		return this.page
			.locator('[data-testid="token-cards"]')
			.getByText("Token Price")
			.locator("..");
	}

	/**
	 * Get "Remaining Tokens" card
	 */
	getRemainingTokensCard() {
		return this.page
			.locator('[data-testid="token-cards"]')
			.getByText("Remaining Tokens")
			.locator("..");
	}

	/**
	 * Get card value element (second div child contains the value)
	 */
	getCardValue(cardLocator: Locator): Locator {
		return cardLocator.locator('[data-testid="card-value"]');
	}

	/**
	 * Get user tokens card (legacy method for backward compatibility)
	 */
	getUserTokensCard() {
		return this.getYourTokensCard();
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
			).first();
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
		return this.page.locator('[data-testid="ico-phases"]');
	}

	/**
	 * Get ICO phases title
	 * CardTitle is a div, so we use text-based selector
	 */
	getIcoPhasesTitle() {
		return this.page
			.locator('[data-testid="ico-phases"]')
			.getByText("ICO Phases")
			.first();
	}

	/**
	 * Get ICO phases description
	 * CardDescription is a div, so we use text-based selector
	 */
	getIcoPhasesDescription() {
		return this.page
			.locator('[data-testid="ico-phases"]')
			.getByText("Token sale schedule and pricing");
	}

	/**
	 * Get all ICO phase cards
	 */
	getIcoPhaseCards() {
		return this.page
			.locator('[data-testid="ico-phases"]')
			.locator('div[class*="relative"]:has(h3)');
	}

	/**
	 * Get recent transactions table
	 */
	getRecentTransactionsTable() {
		return this.page
			.locator('[data-testid="recent-transactions"]')
			.locator("table");
	}

	/**
	 * Get recent transactions table headers
	 */
	getRecentTransactionsHeaders() {
		return this.page
			.locator('[data-testid="recent-transactions"]')
			.locator("thead th");
	}

	/**
	 * Get recent transactions table rows
	 */
	getRecentTransactionsRows() {
		return this.page
			.locator('[data-testid="recent-transactions"]')
			.locator("tbody tr");
	}

	/**
	 * Get sidebar element
	 */
	getSidebar() {
		return this.page
			.locator('aside, [role="complementary"]')
			.or(this.page.locator('div[data-slot="sidebar-container"]')).first();
	}

	getSidebarHeader() {
		return this.page.locator('div[data-slot="sidebar-header"][data-sidebar="header"]');
	}

	/**
	 * Get sidebar logo
	 */
	getSidebarLogo() {
		return this.getSidebarHeader()
			.locator('figure > img[alt="The Tiles company Logo"]')
	}

	/**
	 * Get sidebar toggle button
	 */
	getSidebarToggleButton() {
		return this.page.getByRole("button", { name: /Toggle Sidebar/i }).first();
	}

	/**
	 * Get theme toggle button
	 */
	getThemeToggleButton() {
		return this.page.getByRole("button", { name: /Toggle theme/i });
	}

	/**
	 * Get header "Buy {tokenSymbol}" button
	 * Token symbol is dynamic based on the active sale (e.g., "Buy tMJS", "Buy TILE")
	 * Prefer button over link, and use first() to avoid strict mode violations
	 */
	getHeaderBuyButton() {
		// Match "Buy" followed by any token symbol (e.g., "Buy tMJS", "Buy TILE")
		const buyButtonPattern = /^Buy \w+$/;
		return this.page
			.getByRole("button", { name: buyButtonPattern })
			.or(this.page.getByRole("link", { name: buyButtonPattern }))
			.first();
	}

	/**
	 * Get footer element
	 */
	getFooter() {
		return this.page.locator("footer").or(this.page.getByRole("contentinfo"));
	}

	/**
	 * Get footer navigation links
	 */
	getFooterLinks() {
		return this.page.locator("footer").getByRole("link");
	}

	/**
	 * Get footer social media links
	 */
	getFooterSocialLinks() {
		return this.page
			.locator("footer")
			.getByRole("link", { name: /Twitter|TikTok|Discord/i });
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
	 * CardTitle is a div, so we look for the CardTitle div containing the sale name
	 */
	getSaleName() {
		// Sale name is in CardTitle (div) within the fundraising progress section
		// CardTitle has class "text-2xl font-semibold"
		return this.page
			.locator('[data-testid="fundraising-progress"]')
			.locator(".text-2xl.font-semibold") // CardTitle div
			.first();
	}

	/**
	 * Get tokens sold/total tokens text
	 * Token symbol is dynamic (e.g., "tMJS", "TILE") based on the active sale
	 */
	getTokensSoldText() {
		// Look for text containing token counts (e.g., "100,211 / 29,176,667 tMJS" or "100,211 / 29,176,667 TILE")
		// Pattern matches: numbers / numbers followed by any word (token symbol)
		return this.page
			.locator('[data-testid="fundraising-progress"]')
			.getByText(/\d+.*\/.*\d+.*\w+/i);
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
		// More specific pattern to avoid matching "Remaining Tokens"
		return this.page
			.locator('[data-testid="fundraising-progress"]')
			.getByText(/ends in.*days|remaining.*days/i)
			.filter({ hasNot: this.page.getByText("Remaining Tokens", { exact: true }) })
			.first();
	}
}
