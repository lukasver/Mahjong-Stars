import { invariant } from '@epic-web/invariant';
import { BrowserContext, Page } from "@playwright/test";
import { jwtDecode } from "jwt-decode";


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

			// Recursively process children (only element children, not text nodes)
			const children = Array.from(element.children);
			if (children.length > 0) {
				normalized.children = children.map(normalize).filter(Boolean);
			}

			return normalized;
		};

		// Remove all "text" keys from the structure recursively
		const removeTextKeys = (obj: unknown): unknown => {
			if (obj === null || typeof obj !== "object") {
				return obj;
			}

			if (Array.isArray(obj)) {
				return obj.map(removeTextKeys);
			}

			const cleaned: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(obj)) {
				// Skip "text" keys
				if (key === "text") {
					continue;
				}
				// Recursively clean nested objects
				cleaned[key] = removeTextKeys(value);
			}

			return cleaned;
		};

		const normalizedStructure = normalize(root);
		return removeTextKeys(normalizedStructure);
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




export const mockServerActionHeaders = (obj?: Record<string, unknown>) => {
	return {
		"Content-Security-Policy": "default-src 'self' https://*.vercel.app http://localhost:3000;    connect-src 'self' https://api.hel.io/v1/ https://tiplink.io/api/wallet_adapter_ancestors/ https://quaint-convincing-choice.base-mainnet.quiknode.pro/c2ba2df1f23952da94da9e0cd0a5f8d8d028a91a/ https://*.mahjongstars.com http://localhost:3000 https://eu.i.posthog.com https://eu-assets.i.posthog.com https://*.posthog.com min-api.cryptocompare.com wss://*.walletconnect.org wss://*.walletconnect.com https://*.walletconnect.org https://*.walletconnect.com https://*.thirdweb.com wss://eth-mainnet.g.alchemy.com https://eth-mainnet.g.alchemy.com wss://eth-sepolia.g.alchemy.com https://eth-sepolia.g.alchemy.com wss://eth-goerli.g.alchemy.com https://eth-goerli.g.alchemy.com wss://polygon-mainnet.g.alchemy.com https://polygon-mainnet.g.alchemy.com wss://polygon-mumbai.g.alchemy.com https://polygon-mumbai.g.alchemy.com https://*.documenso.com/ https://storage.googleapis.com https://ipfscdn.io https://*.ipfscdn.io https://vercel.live;    frame-src 'self' https://*.walletconnect.org https://*.walletconnect.com https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha https://*.adobesign.com https://*.thirdweb.com/;    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://eu.i.posthog.com https://eu-assets.i.posthog.com https://*.posthog.com https://fonts.googleapis.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha https://www.google.com/recaptcha/enterprise.js https://www.gstatic.com/recaptcha/releases/ https://*.documenso.com/ https://vercel.live https://embed.hel.io/assets/index-v1.js;    worker-src 'self' blob:;    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://embed.hel.io/assets/index-v1.css;    font-src 'self' https://fonts.gstatic.com;    img-src 'self' data: blob: https://*.mahjongstars.com http://localhost:3000 https://rainbowme-res.cloudinary.com/ https://*.ipfscdn.io https://*.walletconnect.org https://*.walletconnect.com https://storage.googleapis.com https://i.ibb.co https://embed.hel.io/assets/index-v1.js https://helio-assets.s3.eu-west-1.amazonaws.com/;    object-src 'none';    base-uri 'self';    form-action 'self';    frame-ancestors 'self' *.thirdweb.com;    block-all-mixed-content;    upgrade-insecure-requests;",
		"Vary": "rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding",
		"Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
		"x-action-revalidated": "[[],0,0]",
		"Content-Type": "text/x-component",
		"Content-Encoding": "gzip",
		"Date": new Date().toUTCString(),
		"Connection": "keep-alive",
		"Keep-Alive": "timeout=5",
		"Transfer-Encoding": "chunked",
		...obj
	}
}

export const getServerActionBody = (data?: Record<string, unknown>) => {
	const serverActionBoundary = "dXLSbo6yd5ln25bAPRNgS";
	// Serialize with RSC format (adds $D prefix to dates)
	const serializedData = serializeForRSC(data);
	const mockResponse = `0:{"a":"$@1","f":"","b":"${serverActionBoundary}"}` +
		'\n' +
		`1:${JSON.stringify(serializedData)}` +
		// Server Action expect empty line at the end
		'\n';

	return mockResponse;
}

// Helper function to serialize dates with $D prefix for Next.js RSC format
export const serializeForRSC = (obj: unknown): unknown => {
	if (obj === null || obj === undefined) return obj;
	if (typeof obj === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
		// Date string - add $D prefix
		return `$D${obj}`;
	}
	if (Array.isArray(obj)) {
		return obj.map(serializeForRSC);
	}
	if (typeof obj === "object") {
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj)) {
			result[key] = serializeForRSC(value);
		}
		return result;
	}
	return obj;
};


const getStorageContent = async (context: BrowserContext) => {
	return await context.storageState()
}

export const getDecodedJwtFromStorage = async (context: BrowserContext) => {
	const storage = await getStorageContent(context)
	const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL;
	invariant(baseUrl, "PLAYWRIGHT_TEST_BASE_URL is not set");
	const originData = storage.origins.find(o => o.origin === baseUrl)
	const jwt = originData?.localStorage.find((ls) => ls.name.includes("walletToken-"))?.value
	invariant(jwt, "JWT is not set");
	return jwtDecode(jwt);
}



/**
 * get the storage state and return the user wallet address if exists. Throws otherwise.
 * @param context Browser Context from Playwright
 * @returns user wallet address string
 */
export const getUserWalletAddressFromStorage = async (context: BrowserContext) => {
	const decoded = await getDecodedJwtFromStorage(context);
	return decoded.sub;
}
