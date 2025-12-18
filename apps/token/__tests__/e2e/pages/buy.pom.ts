import { expect, Locator, Page } from "@playwright/test";
import { ROUTES, TIMEOUTS } from "../utils/constants";
import { getServerActionBody, mockServerActionHeaders } from "../utils/helpers";
import { BasePage } from "./base.pom";

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
		return this.page
			.locator('[data-testid="sale-header"]')
			.getByRole("heading", {
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
		return this.page
			.locator("#overview, section#overview")
			.or(
				this.page
					.locator("main")
					.locator('[data-testid="overview-card"]')
					.filter({ hasText: /Overview|Tokens available/i }),
			)
			.or(
				this.page
					.locator("main")
					.locator('[data-testid="overview-section"]')
					.filter({ hasText: /Overview|Tokens available/i }),
			)
			.first();
	}

	/**
	 * Get Overview card title
	 */
	getOverviewTitle() {
		// Find "Overview" text in main content area, excluding sidebar/nav/buttons
		// The text appears as a DIV element, not a heading
		return this.getOverviewSection()
			.getByText("Overview", { exact: true })
			.filter({
				hasNot: this.page.locator('nav, aside, [role="complementary"], button'),
			})
			.first();
	}

	/**
	 * Get overview row value by title
	 * Finds the label, then gets the value element (sibling after the label)
	 * Structure: parent DIV contains label SPAN and value SPAN
	 */
	getOverviewRow(title: string) {
		const label = this.getOverviewSection().getByText(title, { exact: false });

		// Get the parent container that holds both label and value
		const rowContainer = label.locator("..");

		// The value is typically the last child (second child) of the parent
		// This works because the structure is: [label, value]
		return rowContainer.locator("> *").last();
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
	 * Prioritizes data-testid (visible section), excludes hidden anchor elements
	 */
	getInvestSection() {
		return this.page.locator('[data-testid="invest-section"]');
	}

	/**
	 * Get Invest heading
	 * Note: "Invest" is not a heading element, it's a DIV with heading-like styling
	 */
	getInvestHeading() {
		return this.getInvestSection().getByText("Invest", { exact: true }).first();
	}

	/**
	 * Get countdown timer
	 */
	getCountdownTimer() {
		return this.getInvestSection().locator(
			"text=/ends in|remaining|days|hours|minutes/i",
		);
	}

	/**
	 * Get token amount input field
	 * Note: Uses spinbutton role with aria-label containing token symbol (e.g., "tMJS Tokens", "TILE Tokens")
	 * Token symbol is dynamic based on the active sale
	 */
	getTokenAmountInput() {
		// Match any token symbol followed by "Tokens" (e.g., "tMJS Tokens", "TILE Tokens")
		const tokenLabelPattern = /\w+ Tokens/i;
		return this.getInvestSection()
			.getByRole("spinbutton", { name: tokenLabelPattern })
			.or(
				this.getInvestSection().locator(
					'input[name*="quantity"], input[name*="paid.quantity"]',
				),
			)
			.first();
	}

	/**
	 * Get USD amount input field
	 * Note: Uses textbox role near "To pay" label
	 */
	getTotalAmountInput() {
		return this.getInvestSection()
			.getByRole("textbox", { name: /To pay/i })
			.or(
				this.getInvestSection().locator(
					'input[name*="amount"], input[name*="paid.amount"]',
				),
			)
			.first();
	}

	/**
	 * Get payment method selector
	 * Note: Finds the visible combobox that contains "USD" text, located near "To pay" label
	 */
	getPaymentMethodSelector() {
		// Find combobox that contains "USD" - most reliable selector
		// It's in the same flex container as "To pay" text
		return this.page
			.locator('[data-testid="currency-selector"]')
			.getByRole("combobox");
	}

	/**
	 * Get the currency dropdown content wrapper
	 * Note: Radix UI uses this attribute for dropdown content
	 */
	getCurrencyDropdownContent() {
		return this.page.locator("[data-radix-popper-content-wrapper]");
	}

	/**
	 * Get FIAT section header in currency dropdown
	 */
	getFiatSectionHeader() {
		return this.getCurrencyDropdownContent().getByText("FIAT", { exact: true });
	}

	/**
	 * Get CRYPTO section header in currency dropdown
	 */
	getCryptoSectionHeader() {
		return this.getCurrencyDropdownContent().getByText("CRYPTO", {
			exact: true,
		});
	}

	/**
	 * Get a specific currency option by code (e.g., "USD", "EUR", "BTC", "ETH")
	 */
	getCurrencyOption(currencyCode: string) {
		return this.getCurrencyDropdownContent()
			.getByRole("option", { name: new RegExp(`^${currencyCode}$`, "i") })
			.or(
				this.getCurrencyDropdownContent().getByText(
					new RegExp(`^${currencyCode}$`, "i"),
				),
			)
			.first();
	}

	/**
	 * Get all currency options in the dropdown
	 * Note: Should be called after opening the combobox
	 */
	getAllCurrencyOptions() {
		return this.getCurrencyDropdownContent().getByRole("option");
	}

	/**
	 * Get Continue/Invest button
	 */
	getContinueButton() {
		return this.getInvestSection().getByRole("button", {
			name: /Continue|Invest|Submit|Purchase Tokens/i,
		});
	}

	/**
	 * Get error message
	 * Note: Error messages are rendered as <p> elements with data-slot="form-message"
	 * or paragraphs with text-destructive class. This excludes form labels with error styling.
	 */
	getErrorMessage() {
		// Target actual error message paragraphs, not form labels
		// FormMessage renders as <p data-slot="form-message" className="text-destructive">
		return this.getInvestSection()
			.locator('p[data-slot="form-message"], p.text-destructive')
			.filter({ hasNot: this.page.locator("label") }); // Exclude any labels that might match
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
		return this.getInvestSection().locator(
			"text=/sale.*ended|not.*active|disabled/i",
		);
	}

	/**
	 * Get the summary modal dialog
	 * Note: This is the confirmation modal that appears after clicking "Purchase Tokens"
	 */
	getSummaryModal() {
		return this.page.getByRole("dialog", { name: /Review your purchase/i });
	}

	/**
	 * Get the token symbol from the current sale
	 * This is a helper method to get the dynamic token symbol for use in other methods
	 * Note: Token symbol is dynamic (e.g., "tMJS", "TILE") based on the active sale
	 */
	async getTokenSymbol(): Promise<string> {
		// Try to get token symbol from the overview section
		const symbolField = this.getSymbolField();
		const symbolText = await symbolField.textContent().catch(() => null);
		if (symbolText) {
			return symbolText.trim();
		}
		// Fallback: try to extract from token amount input label
		const tokenInput = this.getTokenAmountInput();
		const label = await tokenInput.getAttribute("aria-label").catch(() => null);
		if (label) {
			const match = label.match(/^(\w+)\s+Tokens/i);
			if (match && match[1]) {
				return match[1];
			}
		}
		// Last resort: return empty string (caller should handle)
		return "";
	}

	/**
	 * Get KYC Required indicator in the summary modal
	 * Note: This is an alert that appears when KYC verification is required
	 */
	getSummaryKYCRequiredIndicator() {
		return this.getSummaryModal()
			.getByRole("alert")
			.filter({ hasText: /KYC Required/i });
	}

	/**
	 * Get SAFT Required indicator in the summary modal
	 * Note: This is an alert that appears when SAFT agreement signing is required
	 */
	getSummarySAFTRequiredIndicator() {
		return this.getSummaryModal()
			.getByRole("alert")
			.filter({ hasText: /SAFT Agreement/i });
	}

	/**
	 * Get summary modal details section
	 * Contains: {tokenSymbol} Tokens, Bonus Tokens, Total Tokens, Total amount to pay
	 * Note: The values are dynamic and depend on the actual purchase values.
	 * Token symbol is dynamic (e.g., "tMJS", "TILE") based on the active sale.
	 * Structure:
	 * - title: Summary
	 * - {tokenSymbol} Tokens: [quantity]
	 * - Bonus Tokens: [+bonus]
	 * - Total Tokens: [total] {tokenSymbol}
	 * - Total amount to pay: $[amount]
	 */
	getSummaryModalDetails() {
		// Find the container within the modal that contains all summary details
		// It should contain both "{tokenSymbol} Tokens" and "Total amount to pay" text
		// Token symbol is dynamic, so we match any word followed by "Tokens"
		return this.getSummaryModal()
			.locator("div")
			.filter({ hasText: /\w+ Tokens/i })
			.filter({ hasText: /Total amount to pay/i })
			.first();
	}

	/**
	 * Get payment method section in the summary modal
	 * Note: Returns the container with payment method selection (Credit/Debit Card, Bank Transfer)
	 */
	getSummaryModalPaymentMethod() {
		return this.getSummaryModal().locator(
			'[data-testid="fiat-payment-radio-selector"]',
		);
	}

	getCreditCardPaymentMethodRadioButton() {
		return this.getSummaryModalPaymentMethod().getByRole("radio", {
			name: /Credit\/Debit Card/i,
		});
	}

	getBankTransferPaymentMethodRadioButton() {
		return this.getSummaryModalPaymentMethod().getByRole("radio", {
			name: /Bank Transfer/i,
		});
	}

	/**
	 * Get Continue button in the summary modal
	 * Note: Button text may vary (e.g., "Continue with Card", "Continue")
	 */
	getSummaryModalContinueButton() {
		return this.getSummaryModal().getByRole("button", {
			name: /Continue|Proceed/i,
		});
	}

	/**
	 * Get Cancel button in the summary modal
	 */
	getSummaryModalCancelButton() {
		return this.getSummaryModal().getByRole("button", { name: /Cancel/i });
	}

	/**
	 * Intercept POST requests to the buy route and inspect the request body
	 * @returns Promise that resolves when the route is set up
	 */
	async interceptBuyRequest() {
		return this.page.route("**/dashboard/buy", async (route) => {
			const request = route.request();

			// Only intercept POST requests
			if (request.method() !== "POST") {
				await route.continue();
				return;
			}

			const postDataJSON = request.postDataJSON();
			// Build the transaction data
			const transactionData = {
				id: postDataJSON?.id ?? "cmiywwang00038o4rid0jd6xf",
				tokenSymbol: postDataJSON?.tokenSymbol ?? "TILE",
				quantity: postDataJSON?.quantity ?? "1",
				formOfPayment: postDataJSON?.formOfPayment ?? "TRANSFER",
				amountPaid: postDataJSON?.amountPaid ?? null,
				paidCurrency: postDataJSON?.paidCurrency ?? "USD",
				receivingWallet:
					postDataJSON?.receivingWallet ??
					"0x161F6D1895bE66Fc6b5dD2FDEF94afB4810D776b",
				comment: postDataJSON?.comment ?? null,
				status: postDataJSON?.status ?? "PENDING",
				price: postDataJSON?.price ?? "0.012",
				totalAmount: postDataJSON?.totalAmount ?? "0.012",
				createdAt: postDataJSON?.createdAt ?? new Date().toISOString(),
				updatedAt: postDataJSON?.updatedAt ?? new Date().toISOString(),
				user: postDataJSON?.user ?? {
					email: "lucas+tg@smat.io",
					walletAddress: "0x161F6D1895bE66Fc6b5dD2FDEF94afB4810D776b",
					id: "cmhewa4ml0000ju04pmpoe2ve",
				},
				sale: postDataJSON?.sale ?? {
					id: "cmfmgtu86000fky04l5zgrs4d",
					name: "Test Sale",
					tokenSymbol: "TILE",
				},
			};

			await route.fulfill({
				status: 200,
				headers: mockServerActionHeaders(),
				contentType: "text/x-component",
				body: getServerActionBody({
					data: {
						transaction: transactionData,
						saft: true,
						kyc: true,
						paymentMethod: postDataJSON?.formOfPayment ?? "TRANSFER",
					},
				}),
			});
		});
	}

	getContinueTransactionButton() {
		return this.page.getByRole("button", {
			name: /Continue pending Transaction/i,
		});
	}

	async cancelExistingTransactionIfExists() {
		const btn = this.getContinueTransactionButton();

		// If button was not found, no pending transaction exists
		if ((await btn.count()) === 0) {
			console.debug("No pending transaction found");
			return;
		}
		console.debug("Pending transaction found, proceeding to cancel");

		await btn.click();
		const dialog = this.page
			.getByRole("dialog")
			.filter({ hasText: /You have a pending transaction/i });
		expect(dialog).toBeVisible({ timeout: TIMEOUTS.SHORT });
		expect(
			dialog.getByRole("alert").filter({ hasText: /Action required:/i }),
		).toBeVisible({ timeout: TIMEOUTS.SHORT });

		const deleteButton = dialog.getByRole("button", { name: /Delete/i });
		expect(deleteButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
		await deleteButton.click();

		// Alert dialog
		const alertDialog = dialog
			.getByRole("alertdialog")
			.filter({ hasText: /Delete Transaction/i });
		expect(alertDialog).toBeVisible({ timeout: TIMEOUTS.SHORT });

		// Set up promise to wait for POST request BEFORE clicking delete
		const deleteRequestPromise = this.page.waitForResponse(
			(response) =>
				response.url().endsWith("/dashboard/buy") &&
				response.status() === 200 &&
				response.request().method() === "POST",
			{ timeout: TIMEOUTS.MEDIUM },
		);

		// Click the final delete button in the alert dialog
		await alertDialog.getByRole("button", { name: /Delete/i }).click();

		// Wait for the POST request to complete
		const deleteResponse = await deleteRequestPromise;
		expect(deleteResponse.status()).toBe(200);

		// Wait for both dialogs to be closed
		await Promise.all([
			expect(dialog).not.toBeVisible({ timeout: TIMEOUTS.SHORT }),
			expect(alertDialog).not.toBeVisible({ timeout: TIMEOUTS.SHORT }),
		]);

		return true;
	}
}
