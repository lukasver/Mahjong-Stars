import { Page } from "@playwright/test";
import { ROUTES, TIMEOUTS } from "../utils/constants";
import { BasePage } from "./base-page";

/**
 * Page Object Model for the Buy/Token Purchase page
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
		await this.waitForLoadState();
	}

	/**
	 * Wait for buy page to be fully loaded
	 */
	async waitForBuyPageLoaded(): Promise<void> {
		await this.waitForElement("main", TIMEOUTS.MEDIUM);
	}

	/**
	 * Get token amount input field
	 */
	getTokenAmountInput() {
		return this.page
			.locator('input[type="number"]')
			.or(this.page.getByPlaceholder(/amount|tokens/i))
			.first();
	}

	/**
	 * Enter token amount
	 */
	async enterTokenAmount(amount: string): Promise<void> {
		const input = this.getTokenAmountInput();
		await input.fill(amount);
	}

	/**
	 * Get payment method selector (FIAT/CRYPTO)
	 */
	getPaymentMethodSelector() {
		return this.page
			.locator('[data-testid="payment-method"]')
			.or(this.page.getByText(/Payment Method|Select Payment/i).locator(".."));
	}

	/**
	 * Select payment method
	 */
	async selectPaymentMethod(method: "FIAT" | "CRYPTO"): Promise<void> {
		const selector = this.getPaymentMethodSelector();
		await selector.click();
		await this.page.getByText(method, { exact: true }).click();
	}

	/**
	 * Get submit/create transaction button
	 */
	getSubmitButton() {
		return this.page
			.getByRole("button", { name: /Buy|Purchase|Create Transaction/i })
			.first();
	}

	/**
	 * Submit the purchase form
	 */
	async submitPurchase(): Promise<void> {
		const submitButton = this.getSubmitButton();
		await submitButton.click();
		// Wait for navigation to transaction confirmation page
		await this.waitForURL("**/dashboard/buy/**", { timeout: TIMEOUTS.LONG });
	}

	/**
	 * Get sale information section
	 */
	getSaleInformation() {
		return this.page
			.locator('[data-testid="sale-information"]')
			.or(this.page.getByText(/Sale Information|Token Sale/i).locator(".."));
	}

	/**
	 * Verify buy page is displayed
	 */
	async verifyBuyPageDisplayed(): Promise<void> {
		await this.waitForBuyPageLoaded();
		const hasContent = await this.isPresent("main");
		if (!hasContent) {
			throw new Error("Buy page content not found");
		}
	}
}
