import { expect, Locator, Page } from "@playwright/test";

/**
 * Base page class that provides common functionality for all page objects.
 * All page object classes should extend this class.
 */
export class BasePage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	/**
	 * Navigate to a specific path relative to baseURL
	 */
	async goto(path: string): Promise<void> {
		await this.page.goto(path);
	}

	/**
	 * Wait for page to be fully loaded
	 */
	async waitForLoadState(
		state: "load" | "domcontentloaded" | "networkidle" = "networkidle",
	): Promise<void> {
		await this.page.waitForLoadState(state);
	}

	/**
	 * Wait for a specific URL pattern
	 */
	async waitForURL(
		url: string | RegExp,
		options?: { timeout?: number },
	): Promise<void> {
		await this.page.waitForURL(url, options);
	}

	/**
	 * Get page title
	 */
	async getTitle(): Promise<string> {
		return await this.page.title();
	}

	/**
	 * Get current URL
	 */
	getURL(): string {
		return this.page.url();
	}

	/**
	 * Wait for an element to be visible
	 */
	async waitForElement(selector: string, timeout?: number): Promise<Locator> {
		const element = this.page.locator(selector);
		await element.waitFor({ state: "visible", timeout });
		return element;
	}

	/**
	 * Wait for an element to be hidden
	 */
	async waitForElementHidden(
		selector: string,
		timeout?: number,
	): Promise<void> {
		await this.page.locator(selector).waitFor({ state: "hidden", timeout });
	}

	/**
	 * Click on an element
	 */
	async click(selector: string, options?: { timeout?: number }): Promise<void> {
		await this.page.locator(selector).click(options);
	}

	/**
	 * Fill an input field
	 */
	async fill(
		selector: string,
		value: string,
		options?: { timeout?: number },
	): Promise<void> {
		await this.page.locator(selector).fill(value, options);
	}

	/**
	 * Get text content of an element
	 */
	async getText(selector: string): Promise<string> {
		return (await this.page.locator(selector).textContent()) || "";
	}

	/**
	 * Check if an element is visible
	 */
	async isVisible(selector: string): Promise<boolean> {
		return await this.page.locator(selector).isVisible();
	}

	/**
	 * Check if an element exists
	 */
	async isPresent(selector: string): Promise<boolean> {
		return (await this.page.locator(selector).count()) > 0;
	}

	/**
	 * Take a screenshot
	 */
	async screenshot(path: string): Promise<void> {
		await this.page.screenshot({ path });
	}

	/**
	 * Wait for navigation
	 */
	async waitForNavigation(
		action: () => Promise<void>,
		options?: { timeout?: number; url?: string | RegExp },
	): Promise<void> {
		await Promise.all([
			this.page.waitForURL(options?.url || "**", { timeout: options?.timeout }),
			action(),
		]);
	}

	/**
	 * Reload the page
	 */
	async reload(): Promise<void> {
		await this.page.reload();
	}

	/**
	 * Go back in browser history
	 */
	async goBack(): Promise<void> {
		await this.page.goBack();
	}

	/**
	 * Get locator by role
	 */
	getByRole(
		role: "button" | "link" | "heading" | "textbox" | "checkbox" | "radio",
		options?: { name?: string | RegExp },
	): Locator {
		return this.page.getByRole(role, options);
	}

	/**
	 * Get locator by text
	 */
	getByText(text: string | RegExp): Locator {
		return this.page.getByText(text);
	}

	/**
	 * Get locator by test ID
	 */
	getByTestId(testId: string): Locator {
		return this.page.getByTestId(testId);
	}

	/**
	 * Wait for network to be idle
	 */
	async waitForNetworkIdle(): Promise<void> {
		await this.page.waitForLoadState("networkidle");
	}

	/**
	 * Assert that element is visible
	 */
	async expectVisible(selector: string): Promise<void> {
		await expect(this.page.locator(selector)).toBeVisible();
	}

	/**
	 * Assert that element contains text
	 */
	async expectText(selector: string, text: string | RegExp): Promise<void> {
		await expect(this.page.locator(selector)).toContainText(text);
	}
}
