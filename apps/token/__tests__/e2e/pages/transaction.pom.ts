import crypto from "node:crypto";
import { expect, Page } from "@playwright/test";
import { User } from "@prisma/client";
import { ROLES } from "@/common/config/constants";
import { TIMEOUTS } from "../utils/constants";
import { getServerActionBody, mockServerActionHeaders } from "../utils/helpers";
import { BasePage } from "./base-page";
/**
 * Page Object Model for the Transaction Confirmation page
 */
export class TransactionPage extends BasePage {
	private readonly id: string;
	constructor(page: Page) {
		super(page);
		this.id = crypto.randomUUID();
	}

	get pageId(): string {
		return this.id;
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
			.first();
	}

	/**
	 * Get current step indicator
	 */
	getCurrentStep() {
		return this.getStepIndicators().locator('[data-state="active"]');
	}

	/**
	 * Get all step indicators
	 */
	getStepIndicators() {
		return this.page
			.locator('[data-testid^="step-indicator-"]')
			.or(
				this.page
					.locator('[role="button"]')
					.filter({ hasText: /KYC|SAFT|Payment|Confirmation/i }),
			);
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
	 * Get KYC document upload area
	 */
	getKycUploadArea() {
		return this.page.getByTestId("kyc-upload-area");
	}

	/**
	 * Get KYC file input
	 */
	getKycFileInput() {
		return this.getKycUploadArea().locator('input[type="file"]').first();
	}

	/**
	 * Get KYC continue button
	 */
	getKycContinueButton() {
		return this.page
			.getByTestId("kyc-upload-form")
			.getByRole("button")
			.filter({ hasText: /Continue|Next|Submit/i })
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
	 * Get SAFT document display area
	 */
	getSaftDocument() {
		return this.page
			.getByTestId("saft-document")
			.or(this.page.getByText(/SAFT|Agreement/i).locator(".."))
			.first();
	}

	/**
	 * Get SAFT sign button
	 */
	getSaftSignButton() {
		return this.page
			.getByRole("button", { name: /Sign|Agree|Accept|Sign Document/i })
			.first();
	}

	/**
	 * Get SAFT continue button
	 */
	getSaftContinueButton() {
		return this.page
			.getByRole("button", { name: /Continue|Next/i })
			.filter({ hasText: /Continue|Next/i })
			.first();
	}

	/**
	 * Get payment step section
	 */
	getPaymentStep() {
		return this.page.getByTestId("payment-step-container");
	}

	/**
	 * Get payment amount display
	 */
	getPaymentAmount() {
		return this.page
			.locator('[data-testid="payment-amount"]')
			.or(this.page.getByText(/\$|USD|EUR|ETH|BTC/i).first());
	}

	/**
	 * Get payment method display
	 */
	getPaymentMethod() {
		return this.page
			.locator('[data-testid="payment-method"]')
			.or(this.page.getByText(/FIAT|CRYPTO|TRANSFER|CARD/i).first());
	}

	/**
	 * Get payment instructions
	 */
	getPaymentInstructions() {
		return this.page
			.locator('[data-testid="payment-instructions"]')
			.or(this.page.getByText(/instructions|reference|account/i).first());
	}

	/**
	 * Get payment reference/ID
	 */
	getPaymentReference() {
		return this.page
			.locator('[data-testid="payment-reference"]')
			.or(this.page.getByText(/reference|ID|transaction/i).first());
	}

	/**
	 * Get wallet address (for crypto payments)
	 */
	getWalletAddress() {
		return this.page
			.locator('[data-testid="wallet-address"]')
			.or(this.page.locator("code").filter({ hasText: /0x/i }).first());
	}

	/**
	 * Get QR code (for crypto payments)
	 */
	getQRCode() {
		return this.page
			.locator('[data-testid="qr-code"]')
			.or(this.page.locator('img[alt*="QR" i], canvas').first());
	}

	/**
	 * Get network/chain information
	 */
	getNetworkInfo() {
		return this.page
			.locator('[data-testid="network-info"]')
			.or(this.page.getByText(/network|chain|blockchain/i).first());
	}

	/**
	 * Get payment submit button
	 */
	getPaymentSubmitButton() {
		return this.page
			.getByRole("button", {
				name: /Submit Payment|Pay Now|Confirm Payment|Mark as Paid|I've Sent Payment/i,
			})
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
	 * Get transaction ID display
	 */
	getTransactionId() {
		return this.page
			.locator('[data-testid="transaction-id"]')
			.or(this.page.getByText(/transaction.*id/i).first());
	}

	/**
	 * Upload KYC document
	 */
	async uploadKycDocument(filePath: string): Promise<void> {
		const fileInput = this.getKycFileInput();
		await fileInput.setInputFiles(filePath);
		// Wait for upload to complete
		await this.waitForElement('[data-testid="upload-complete"]', TIMEOUTS.LONG);
	}

	/**
	 * Sign SAFT agreement
	 * Waits for dialog to close and navigation to payment step
	 */
	async signSaft(): Promise<void> {
		const signButton = this.getSaftSignButton();
		await signButton.click();
		// Wait for dialog to appear
		const dialog = this.page.getByRole("dialog").first();
		await dialog.waitFor({ state: "visible", timeout: TIMEOUTS.MEDIUM });

		// Wait for dialog to close (signature completed)
		await dialog.waitFor({ state: "hidden", timeout: TIMEOUTS.LONG });

		// Wait for navigation to payment step
		const paymentStep = this.getPaymentStep();
		await paymentStep.waitFor({ state: "visible", timeout: TIMEOUTS.MEDIUM });
	}

	/**
	 * Submit payment
	 */
	async submitPayment(): Promise<void> {
		const submitButton = this.getPaymentSubmitButton();
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

	/**
	 * Get success message on status page
	 */
	getSuccessMessage() {
		return this.page
			.locator('[data-testid="success-message"]')
			.or(this.page.getByText(/success|completed|confirmed/i).first());
	}

	/**
	 * Get pending message on status page
	 */
	getPendingMessage() {
		return this.page
			.locator('[data-testid="pending-message"]')
			.or(this.page.getByText(/pending|processing|waiting/i).first());
	}

	/**
	 * Get failure/error message on status page
	 */
	getFailureMessage() {
		return this.page
			.locator('[data-testid="error-message"]')
			.or(this.page.getByText(/error|failed|failure/i).first());
	}

	/**
	 * Get transaction details on status page
	 */
	getTransactionDetails() {
		return this.page
			.locator('[data-testid="transaction-details"]')
			.or(this.page.getByText(/transaction|details/i).first());
	}

	/**
	 * Get "Back to Dashboard" button
	 */
	getBackToDashboardButton() {
		return this.page
			.getByRole("button", {
				name: /Back to Dashboard|View Dashboard|Dashboard/i,
			})
			.first();
	}

	/**
	 * Get "View Transaction" button
	 */
	getViewTransactionButton() {
		return this.page
			.getByRole("button", { name: /View Transaction|Transaction Details/i })
			.first();
	}

	/**
	 * Get "Retry" button
	 */
	getRetryButton() {
		return this.page.getByRole("button", { name: /Retry|Try Again/i }).first();
	}

	/**
	 * Get "Contact Support" button
	 */
	getContactSupportButton() {
		return this.page
			.getByRole("button", { name: /Contact Support|Support/i })
			.first();
	}

	/**
	 * Get "Cancel Transaction" button
	 */
	getCancelTransactionButton() {
		return this.page
			.getByRole("button", { name: /Cancel Transaction|Cancel/i })
			.first();
	}

	/**
	 * Get estimated processing time (for pending status)
	 */
	getEstimatedProcessingTime() {
		return this.page
			.locator('[data-testid="processing-time"]')
			.or(this.page.getByText(/processing|estimated|time/i).first());
	}

	/**
	 * Check if step is completed
	 */
	async isStepCompleted(stepName: string): Promise<boolean> {
		const step = this.page
			.getByText(new RegExp(stepName, "i"))
			.locator("..")
			.first();
		const ariaLabel = await step.getAttribute("aria-label");
		return (
			ariaLabel?.includes("completed") || ariaLabel?.includes("done") || false
		);
	}

	/**
	 * Check if step is active
	 */
	async isStepActive(stepName: string): Promise<boolean> {
		const step = this.getCurrentStep();
		const text = await step.innerText();
		return text === stepName || false;
	}

	/**
	 * Check if step is disabled
	 */
	async isStepDisabled(stepName: string): Promise<boolean> {
		const step = this.page
			.getByText(new RegExp(stepName, "i"))
			.locator("..")
			.first();
		const disabled = await step.getAttribute("disabled");
		const ariaDisabled = await step.getAttribute("aria-disabled");
		return disabled !== null || ariaDisabled === "true";
	}

	/**
	 * Get email verification dialog
	 */
	getEmailVerificationDialog() {
		return this.page.getByTestId("verify-email-dialog");
	}

	/**
	 * Get email verification dialog title
	 */
	getEmailVerificationTitle() {
		return this.page.getByRole("heading", { name: /verify email/i });
	}

	/**
	 * Get email verification dialog description
	 */
	getEmailVerificationDescription() {
		return this.getEmailVerificationDialog().getByText(
			/please verify your email address to proceed/i,
		);
	}

	/**
	 * Get email input field in verification dialog
	 */
	getEmailInput() {
		return this.getEmailVerificationDialog().getByRole("textbox", {
			name: /enter email/i,
		});
	}

	/**
	 * Get first name input field in verification dialog
	 */
	getFirstNameInput() {
		return this.getEmailVerificationDialog().getByRole("textbox", {
			name: /first name/i,
		});
	}

	/**
	 * Get last name input field in verification dialog
	 */
	getLastNameInput() {
		return this.getEmailVerificationDialog().getByRole("textbox", {
			name: /last name/i,
		});
	}

	/**
	 * Get "Send code" button in verification dialog
	 */
	getSendCodeButton() {
		return this.getEmailVerificationDialog().getByRole("button", {
			name: /send code/i,
		});
	}

	/**
	 * Get token input field in verification dialog (step 2)
	 */
	getTokenInput() {
		return this.getEmailVerificationDialog().getByRole("textbox", {
			name: /enter code/i,
		});
	}

	/**
	 * Get "Verify" button in verification dialog (step 2)
	 */
	getVerifyButton() {
		return this.getEmailVerificationDialog().getByRole("button", {
			name: /verify/i,
		});
	}

	/**
	 * Wait for email verification dialog to appear
	 */
	async waitForEmailVerificationDialog(): Promise<void> {
		const dialog = this.getEmailVerificationDialog();
		await dialog.waitFor({ state: "visible", timeout: TIMEOUTS.MEDIUM });
	}

	/**
	 * Wait for email verification dialog to close
	 */
	async waitForEmailVerificationDialogClose(): Promise<void> {
		const dialog = this.getEmailVerificationDialog();
		await dialog.waitFor({ state: "hidden", timeout: TIMEOUTS.LONG });
	}

	/**
	 * Fill email verification form (step 1)
	 */
	async fillEmailVerificationForm(
		email: string,
		firstName?: string,
		lastName?: string,
	): Promise<void> {
		if (firstName) {
			await this.getFirstNameInput().fill(firstName);
		}
		if (lastName) {
			await this.getLastNameInput().fill(lastName);
		}
		await this.getEmailInput().fill(email);
	}

	async interceptEmailVerificationRequest(
		txId: string,
		args: {
			email?: string;
			firstName?: string;
			lastName?: string;
		},
	): Promise<void> {
		return this.page.route(`**/dashboard/buy/${txId}`, async (route) => {
			const request = route.request();
			// Only intercept POST requests
			if (request.method() !== "POST") {
				await route.continue();
				return;
			}
			const postDataJSON = request.postDataJSON();

			expect(postDataJSON).toBeDefined();
			expect(Array.isArray(postDataJSON)).toBe(true);
			expect(postDataJSON[0]).toHaveProperty("email", args.email);
			expect(postDataJSON[0]).toHaveProperty("firstName", args.firstName);
			expect(postDataJSON[0]).toHaveProperty("lastName", args.lastName);

			await route.fulfill({
				status: 200,
				headers: mockServerActionHeaders(),
				contentType: "text/x-component",
				body: getServerActionBody({
					data: {
						success: true,
						status: 200,
						data: true,
					},
				}),
			});
		});
	}

	async interceptGetCurrentUserRequest(
		overrides?:
			| (User & { roles: Record<keyof typeof ROLES, string> })
			| undefined,
	): Promise<void> {
		return this.page.route(`**/api/proxy/users/me`, async (route) => {
			const request = route.request();
			// Only intercept POST requests
			if (request.method() !== "POST") {
				await route.continue();
				return;
			}

			const response = await route.fetch();
			const responseBody = await response.json();

			console.debug("🚀 ~ transaction-page.ts:598 ~ responseBody:", responseBody);
			expect(responseBody).toBeDefined();


			await route.fulfill({
				status: 200,
				body: JSON.stringify({
					success: true,
					status: 200,
					data: Object.assign(responseBody, overrides),
				}),

			})
		});
	}

	async interceptEmailTokenVerificationRequest(txId: string, success: boolean = true): Promise<void> {
		return this.page.route(`**/dashboard/buy/${txId}`, async (route) => {
			const request = route.request();
			// Only intercept POST requests
			if (request.method() !== "POST") {
				await route.continue();
				return;
			}

			route.fulfill({
				status: 200,
				headers: mockServerActionHeaders(),
				contentType: "text/x-component",
				body: getServerActionBody({
					data: {
						success: success,
						status: 200,
						data: success ? 'Email verified successfully' : '"Failed to verify code"',
					}
				})
			});
		});
	};

	async getEmailVerificationSuccessMessage() {
		return await this.page.getByText(/email verified/i).first();
	}

	/**
	 * Submit email verification form (step 1)
	 */
	async submitEmailVerificationForm() {
		await this.getSendCodeButton().click();
	}

	/**
	 * Fill and submit token verification form (step 2)
	 */
	async verifyEmailToken(token: string): Promise<void> {
		await this.getTokenInput().fill(token);
		await this.getVerifyButton().click();
	}
};
