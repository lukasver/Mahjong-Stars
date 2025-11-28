import { Page } from "@playwright/test";
import { TIMEOUTS } from "../utils/constants";
import { BasePage } from "./base-page";

/**
 * Page Object Model for the Transaction Confirmation page
 */
export class TransactionPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}

	/**
	 * Navigate to transaction confirmation page
	 */
	async goto(transactionId: string): Promise<void> {
		await super.goto(`/dashboard/buy/${transactionId}`);
		await this.waitForLoadState();
	}

	/**
	 * Wait for transaction page to be fully loaded
	 */
	async waitForTransactionPageLoaded(): Promise<void> {
		await this.waitForElement("main", TIMEOUTS.MEDIUM);
	}

	/**
	 * Get transaction stepper component
	 */
	getStepper() {
		return this.page
			.locator('[data-testid="transaction-stepper"]')
			.or(this.page.getByText(/KYC|SAFT|Payment|Confirmation/i).locator(".."));
	}

	/**
	 * Get current step indicator
	 */
	getCurrentStep() {
		return this.page
			.locator('[data-testid="current-step"]')
			.or(this.page.locator('[aria-current="step"]'));
	}

	/**
	 * Get KYC step section
	 */
	getKycStep() {
		return this.page
			.getByText(/KYC|Know Your Customer/i)
			.locator("..")
			.first();
	}

	/**
	 * Get SAFT step section
	 */
	getSaftStep() {
		return this.page
			.getByText(/SAFT|Agreement/i)
			.locator("..")
			.first();
	}

	/**
	 * Get payment step section
	 */
	getPaymentStep() {
		return this.page
			.getByText(/Payment|Pay/i)
			.locator("..")
			.first();
	}

	/**
	 * Get confirmation step section
	 */
	getConfirmationStep() {
		return this.page
			.getByText(/Confirmation|Confirm/i)
			.locator("..")
			.first();
	}

	/**
	 * Upload KYC document
	 */
	async uploadKycDocument(filePath: string): Promise<void> {
		const fileInput = this.page.locator('input[type="file"]').first();
		await fileInput.setInputFiles(filePath);
		// Wait for upload to complete
		await this.waitForElement('[data-testid="upload-complete"]', TIMEOUTS.LONG);
	}

	/**
	 * Sign SAFT agreement
	 */
	async signSaft(): Promise<void> {
		const signButton = this.page
			.getByRole("button", { name: /Sign|Agree|Accept/i })
			.first();
		await signButton.click();
		// Wait for signature process
		await this.waitForElement(
			'[data-testid="signature-complete"]',
			TIMEOUTS.LONG,
		);
	}

	/**
	 * Submit payment
	 */
	async submitPayment(): Promise<void> {
		const submitButton = this.page
			.getByRole("button", { name: /Submit Payment|Pay Now|Confirm Payment/i })
			.first();
		await submitButton.click();
	}

	/**
	 * Get payment status indicator
	 */
	getPaymentStatus() {
		return this.page
			.locator('[data-testid="payment-status"]')
			.or(this.page.getByText(/Pending|Success|Failed|Verified/i).first());
	}

	/**
	 * Verify transaction page is displayed
	 */
	async verifyTransactionPageDisplayed(): Promise<void> {
		await this.waitForTransactionPageLoaded();
		const hasContent = await this.isPresent("main");
		if (!hasContent) {
			throw new Error("Transaction page content not found");
		}
	}

	/**
	 * Navigate to transaction status page
	 */
	async navigateToStatus(
		transactionId: string,
		status: "success" | "failure" | "pending",
	): Promise<void> {
		await super.goto(`/dashboard/buy/${transactionId}/${status}`);
		await this.waitForLoadState();
	}
}
