import { Page } from "@playwright/test";

/**
 * Wait for a specific amount of time
 */
export async function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get normalized page structure for snapshot testing
 * Extracts element roles, types, and hierarchy while removing dynamic content
 */
export async function getNormalizedPageStructure(
	page: Page,
	rootSelector = "main",
): Promise<unknown> {
	const structure = await page.evaluate((selector) => {
		const root = document.querySelector(selector);
		if (!root) return null;

		const normalize = (element: Element | null): unknown | null => {
			if (!element) return null;

			const normalized: Record<string, unknown> = {
				tag: element.tagName.toLowerCase(),
			};

			// Get role if available
			const role = element.getAttribute("role");
			if (role) {
				normalized.role = role;
			}

			// Get data-testid if available (stable identifier)
			const testId = element.getAttribute("data-testid");
			if (testId) {
				normalized.testId = testId;
			}

			// Get aria-label if available (normalized)
			const ariaLabel = element.getAttribute("aria-label");
			if (ariaLabel) {
				// Normalize dynamic content
				const normalizedLabel = ariaLabel
					.replace(/0x[a-fA-F0-9]{4,}/g, "0x...")
					.replace(
						/\d+\s+(day|days|hour|hours|minute|minutes)\s+ago/g,
						"X time ago",
					)
					.replace(/\$[\d,]+/g, "$X")
					.replace(/[\d,]+ TILE/g, "X TILE")
					.replace(/[\d,]+%/g, "X%")
					.replace(/[\d,]+ BNB/g, "X BNB");
				normalized.ariaLabel = normalizedLabel;
			}

			// Get text content (normalized) if element has direct text
			const textContent =
				element.childNodes[0]?.nodeType === Node.TEXT_NODE
					? element.childNodes[0].textContent?.trim()
					: null;
			if (textContent && textContent.length > 0 && textContent.length < 100) {
				// Only include short text nodes, normalize dynamic content
				const normalizedText = textContent
					.replace(/0x[a-fA-F0-9]{4,}/g, "0x...")
					.replace(
						/\d+\s+(day|days|hour|hours|minute|minutes)\s+ago/g,
						"X time ago",
					)
					.replace(/\$[\d,]+/g, "$X")
					.replace(/[\d,]+ TILE/g, "X TILE")
					.replace(/[\d,]+%/g, "X%")
					.replace(/[\d,]+ BNB/g, "X BNB");
				normalized.text = normalizedText;
			}

			// Recursively process children
			const children = Array.from(element.children);
			if (children.length > 0) {
				normalized.children = children.map(normalize).filter(Boolean);
			}

			return normalized;
		};

		return normalize(root);
	}, rootSelector);

	return structure;
}

/**
 * Wait for network requests to complete
 */
export async function waitForNetworkIdle(
	page: Page,
	timeout = 30000,
): Promise<void> {
	await page.waitForLoadState("networkidle", { timeout });
}

/**
 * Wait for element to be removed from DOM
 */
export async function waitForElementRemoved(
	page: Page,
	selector: string,
	timeout = 10000,
): Promise<void> {
	await page.waitForSelector(selector, { state: "detached", timeout });
}

/**
 * Check if element exists without throwing
 */
export async function elementExists(
	page: Page,
	selector: string,
): Promise<boolean> {
	try {
		await page.waitForSelector(selector, { timeout: 1000, state: "attached" });
		return true;
	} catch {
		return false;
	}
}

/**
 * Get text content safely (returns empty string if not found)
 */
export async function getTextSafely(
	page: Page,
	selector: string,
): Promise<string> {
	try {
		return (await page.locator(selector).textContent()) || "";
	} catch {
		return "";
	}
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(
	page: Page,
	selector: string,
): Promise<void> {
	await page.locator(selector).scrollIntoViewIfNeeded();
}
