import { Page } from "@playwright/test";
import { ROUTES, TIMEOUTS } from "../utils/constants";
import { BasePage } from "./base-page";

/**
 * Page Object Model for the Transactions List page
 */
export class TransactionsListPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}

	/**
	 * Navigate to transactions list page
	 */
	async goto(): Promise<void> {
		await super.goto(ROUTES.TRANSACTIONS);
		await this.waitForLoadState();
	}

	/**
	 * Wait for transactions list to be fully loaded
	 */
	async waitForTransactionsListLoaded(): Promise<void> {
		await this.waitForElement("main", TIMEOUTS.MEDIUM);
	}

	/**
	 * Get transactions table
	 */
	getTransactionsTable() {
		return this.page
			.locator('[data-testid="transactions-table"]')
			.or(this.page.locator("table").first());
	}

	/**
	 * Get transaction rows
	 */
	getTransactionRows() {
		return this.getTransactionsTable().locator("tbody tr");
	}

	/**
	 * Get a specific transaction by ID or index
	 */
	getTransaction(index: number) {
		return this.getTransactionRows().nth(index);
	}

	/**
	 * Get transaction filters
	 */
	getFilters() {
		return this.page
			.locator('[data-testid="transaction-filters"]')
			.or(this.page.getByText(/Filter|Status|Search/i).locator(".."));
	}

	/**
	 * Filter transactions by status
	 */
	async filterByStatus(status: string): Promise<void> {
		const statusFilter = this.page
			.getByText(/Status|Filter by status/i)
			.locator("..")
			.locator("select, button")
			.first();
		await statusFilter.click();
		await this.page.getByText(status, { exact: true }).click();
		// Wait for table to update
		await this.waitForNetworkIdle();
	}

	/**
	 * Search transactions
	 */
	async searchTransactions(query: string): Promise<void> {
		const searchInput = this.page
			.getByPlaceholder(/Search|Filter/i)
			.or(this.page.locator('input[type="search"]'))
			.first();
		await searchInput.fill(query);
		await this.waitForNetworkIdle();
	}

	/**
	 * Click on a transaction to view details
	 */
	async clickTransaction(index: number): Promise<void> {
		const transaction = this.getTransaction(index);
		await transaction.click();
		// Wait for transaction details modal or navigation
		await this.waitForElement(
			'[data-testid="transaction-details"]',
			TIMEOUTS.MEDIUM,
		);
	}

	/**
	 * Get transaction count
	 */
	async getTransactionCount(): Promise<number> {
		const rows = this.getTransactionRows();
		return await rows.count();
	}

	/**
	 * Verify transactions list is displayed
	 */
	async verifyTransactionsListDisplayed(): Promise<void> {
		await this.waitForTransactionsListLoaded();
		const hasContent = await this.isPresent("main");
		if (!hasContent) {
			throw new Error("Transactions list content not found");
		}
	}
}
