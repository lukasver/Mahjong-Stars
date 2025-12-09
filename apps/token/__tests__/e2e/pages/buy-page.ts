import { Locator, Page } from "@playwright/test";
import { ROUTES, TIMEOUTS } from "../utils/constants";
import { BasePage } from "./base-page";

/**
 * Page Object Model for the Buy Page
 * Located at /dashboard/buy
 */
export class BuyPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}

	/**
	 * Navigate to buy page
	 */
	async goto(): Promise<void> {
		await super.goto(ROUTES.BUY);
		await this.waitForBuyPageLoaded();
	}

	/**
	 * Wait for buy page to be fully loaded
	 */
	async waitForBuyPageLoaded(): Promise<void> {
		await this.page.waitForLoadState("networkidle");
		// Wait for main content to be visible
		const mainContent = this.getMainContent();
		await mainContent.waitFor({ state: "visible", timeout: TIMEOUTS.MEDIUM });
	}

	/**
	 * Get main content area
	 */
	getMainContent() {
		return this.page.locator("main");
	}

	/**
	 * Get sale name heading (h1)
	 */
	getSaleName() {
		return this.page.getByRole("heading", {
			name: /Test Sale|.*Sale/i,
			level: 1,
		});
	}

	/**
	 * Get sale description
	 */
	getSaleDescription() {
		return this.page.locator("p.text-xl.text-gray-300");
	}

	/**
	 * Get sale cover image
	 */
	getSaleCoverImage() {
		return this.page.locator("#hero img, [id='hero'] img").first();
	}

	/**
	 * Get Information tab button
	 */
	getInformationTab() {
		return this.page.getByRole("tab", { name: /Information/i });
	}

	/**
	 * Get Documents tab button
	 */
	getDocumentsTab() {
		return this.page.getByRole("tab", { name: /Documents/i });
	}

	/**
	 * Get Gallery tab button
	 */
	getGalleryTab() {
		return this.page.getByRole("tab", { name: /Gallery/i });
	}

	/**
	 * Get Information tab content
	 * Returns the accordion containing the information sections
	 */
	getInformationTabContent() {
		return this.page.locator('[data-testid="information-accordion"]');
	}

	/**
	 * Get all information accordion items
	 * Scoped to the accordion container for better reliability
	 */
	getInformationAccordionItems() {
		return this.page
			.locator('[data-testid="information-accordion"]')
			.locator('[data-testid^="information-accordion-item-"]');
	}

	/**
	 * Get accordion trigger button for a specific accordion item
	 * @param accordionItem - The accordion item locator
	 */
	getAccordionTrigger(accordionItem: Locator) {
		return accordionItem.locator('h3 button[role="button"]').first();
	}

	/**
	 * Get Documents tab content
	 * Returns either the documents list (when documents exist) or the placeholder (when empty)
	 */
	getDocumentsTabContent() {
		return this.page
			.locator('[data-testid="documents-tab-content"]')
			.or(
				this.page
					.locator('[role="tabpanel"]')
					.filter({ hasText: /No documents found/i }),
			);
	}

	/**
	 * Get Gallery tab content
	 * Returns either the gallery images (when images exist) or the placeholder (when empty)
	 */
	getGalleryTabContent() {
		return this.page
			.locator('[data-testid="gallery-tab-content"]')
			.or(
				this.page
					.locator('[role="tabpanel"]')
					.filter({ hasText: /No images found/i }),
			);
	}

	/**
	 * Get accordion item by title
	 */
	getAccordionItem(title: string) {
		return this.page.getByRole("button", { name: new RegExp(title, "i") });
	}

	/**
	 * Get Overview section
	 */
	getOverviewSection() {
		return this.page.locator("#overview, section#overview").or(
			this.page.locator('main').locator('[data-testid="overview-card"]').filter({ hasText: /Overview|Tokens available/i })
		).or(
			this.page.locator('main').locator('[data-testid="overview-section"]').filter({ hasText: /Overview|Tokens available/i })
		);
	}

	/**
	 * Get Overview card title
	 */
	getOverviewTitle() {
		// Find "Overview" text in main content area, excluding sidebar/nav/buttons
		// The text appears as a DIV element, not a heading
		return this.getOverviewSection()
			.getByText("Overview", { exact: true })
			.filter({ hasNot: this.page.locator('nav, aside, [role="complementary"], button') })
			.first();
	}

	/**
	 * Get overview row by title
	 */
	getOverviewRow(title: string) {
		return this.getOverviewSection()
			.getByText(title, { exact: false })
			.locator("..")
			.locator("..");
	}

	/**
	 * Get "Tokens available" value
	 */
	getTokensAvailable() {
		return this.getOverviewRow("Tokens available");
	}

	/**
	 * Get "Sold" percentage
	 */
	getSoldPercentage() {
		return this.getOverviewRow("Sold");
	}

	/**
	 * Get progress bar
	 */
	getProgressBar() {
		return this.getOverviewSection().locator(
			"[class*='progress'], [role='progressbar']",
		);
	}

	/**
	 * Get "Total Tokens" value
	 */
	getTotalTokens() {
		return this.getOverviewRow("Total Tokens");
	}

	/**
	 * Get "Name" field value
	 */
	getNameField() {
		return this.getOverviewRow("Name");
	}

	/**
	 * Get "Symbol" field value
	 */
	getSymbolField() {
		return this.getOverviewRow("Symbol");
	}

	/**
	 * Get "Total supply" value
	 */
	getTotalSupply() {
		return this.getOverviewRow("Total supply");
	}

	/**
	 * Get "Price per token" value
	 */
	getPricePerToken() {
		return this.getOverviewRow("Price per token");
	}

	/**
	 * Get "Sale starts" date
	 */
	getSaleStartsDate() {
		return this.getOverviewRow("Sale starts");
	}

	/**
	 * Get "Sale ends" date
	 */
	getSaleEndsDate() {
		return this.getOverviewRow("Sale ends");
	}

	/**
	 * Get Invest section
	 */
	getInvestSection() {
		return this.page.locator("#invest-component, [id*='invest']");
	}

	/**
	 * Get Invest heading
	 */
	getInvestHeading() {
		return this.page
			.locator("#invest-component, [id*='invest']")
			.getByRole("heading", { name: /Invest/i });
	}

	/**
	 * Get countdown timer
	 */
	getCountdownTimer() {
		return this.page
			.locator("#invest-component, [id*='invest']")
			.locator("text=/ends in|remaining|days|hours|minutes/i");
	}

	/**
	 * Get token amount input field
	 */
	getTokenAmountInput() {
		return this.page
			.locator("#invest-component, [id*='invest']")
			.locator('input[name*="quantity"], input[name*="paid.quantity"]')
			.first();
	}

	/**
	 * Get USD amount input field
	 */
	getUsdAmountInput() {
		return this.page
			.locator("#invest-component, [id*='invest']")
			.locator('input[name*="amount"], input[name*="paid.amount"]')
			.first();
	}

	/**
	 * Get payment method selector
	 */
	getPaymentMethodSelector() {
		return this.page
			.locator("#invest-component, [id*='invest']")
			.locator(
				'select, [role="combobox"], button:has-text("FIAT"), button:has-text("CRYPTO")',
			);
	}

	/**
	 * Get FIAT payment option
	 */
	getFiatPaymentOption() {
		return this.page
			.getByRole("option", { name: /FIAT/i })
			.or(this.page.getByText("FIAT"));
	}

	/**
	 * Get CRYPTO payment option
	 */
	getCryptoPaymentOption() {
		return this.page
			.getByRole("option", { name: /CRYPTO/i })
			.or(this.page.getByText("CRYPTO"));
	}

	/**
	 * Get Continue/Invest button
	 */
	getContinueButton() {
		return this.page
			.locator("#invest-component, [id*='invest']")
			.getByRole("button", { name: /Continue|Invest|Submit/i });
	}

	/**
	 * Get error message
	 */
	getErrorMessage() {
		return this.page
			.locator("#invest-component, [id*='invest']")
			.locator('[role="alert"], .error, [class*="error"]');
	}

	/**
	 * Check if form is disabled
	 */
	async isFormDisabled(): Promise<boolean> {
		const tokenInput = this.getTokenAmountInput();
		const isDisabled = await tokenInput.isDisabled().catch(() => false);
		return isDisabled;
	}

	/**
	 * Get disabled message
	 */
	getDisabledMessage() {
		return this.page
			.locator("#invest-component, [id*='invest']")
			.locator("text=/sale.*ended|not.*active|disabled/i");
	}
}
