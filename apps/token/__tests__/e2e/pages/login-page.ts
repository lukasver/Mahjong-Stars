import { Page } from "@playwright/test";
import { ROUTES, TIMEOUTS } from "../utils/constants";
import { BasePage } from "./base-page";

/**
 * Page Object Model for the Login/Home page
 *
 * TODO: This page object is created for future use.
 * Login tests are currently skipped because storing login state
 * with Thirdweb authentication is complex.
 */
export class LoginPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}

	/**
	 * Navigate to login page
	 */
	async goto(): Promise<void> {
		await super.goto(ROUTES.HOME);
		await this.waitForLoadState();
	}

	/**
	 * Get wallet connect button
	 */
	getWalletConnectButton() {
		return this.page
			.getByRole("button", { name: /Connect|Wallet|Login/i })
			.first();
	}

	/**
	 * Click wallet connect button
	 */
	async clickWalletConnect(): Promise<void> {
		const button = this.getWalletConnectButton();
		await button.click();
	}

	/**
	 * Wait for wallet connection modal
	 */
	async waitForWalletModal(): Promise<void> {
		await this.waitForElement('[data-testid="wallet-modal"]', TIMEOUTS.MEDIUM);
	}
}
