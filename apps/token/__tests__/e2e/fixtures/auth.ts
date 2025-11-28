import { existsSync, readFileSync } from "fs";
import { join } from "path";

/**
 * Authentication fixtures and utilities
 *
 * Note: Actual authentication is handled via storage.json.
 * These fixtures provide validation and utility functions.
 */

const STORAGE_PATH = join(
	process.cwd(),
	"__tests__",
	"e2e",
	"playwright",
	".auth",
	"storage.json",
);

/**
 * Check if authentication state exists
 */
export function hasAuthState(): boolean {
	return existsSync(STORAGE_PATH);
}

/**
 * Get authentication state (read-only)
 */
export function getAuthState(): {
	cookies: Array<{
		name: string;
		value: string;
		domain: string;
		[key: string]: unknown;
	}>;
	origins?: Array<{
		origin: string;
		[key: string]: unknown;
	}>;
} | null {
	if (!hasAuthState()) {
		return null;
	}

	try {
		const content = readFileSync(STORAGE_PATH, "utf-8");
		return JSON.parse(content) as {
			cookies: Array<{
				name: string;
				value: string;
				domain: string;
				[key: string]: unknown;
			}>;
			origins?: Array<{
				origin: string;
				[key: string]: unknown;
			}>;
		};
	} catch {
		return null;
	}
}

/**
 * Get cookie count from auth state
 */
export function getCookieCount(): number {
	const state = getAuthState();
	return state?.cookies.length || 0;
}
