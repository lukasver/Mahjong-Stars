import { FullConfig } from "@playwright/test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

/**
 * Global setup function that validates and prepares the authentication state.
 * This runs once before all tests.
 */
async function globalSetup(config: FullConfig) {
	const storagePath = join(
		process.cwd(),
		"__tests__",
		"e2e",
		"playwright",
		".auth",
		"storage.json",
	);

	if (!existsSync(storagePath)) {
		console.warn(`⚠️  Authentication state file not found at ${storagePath}`);
		console.warn("   Tests will run unauthenticated. To authenticate:");
		console.warn("   1. Run: pnpm run e2e:extract-auth-state");
		console.warn("   2. Log in manually in the browser window");
		console.warn("   3. Wait for the storage state to be saved");
		return;
	}

	try {
		const storageContent = readFileSync(storagePath, "utf-8");
		const storageState = JSON.parse(storageContent) as {
			cookies?: Array<{
				name: string;
				value: string;
				domain: string;
				[key: string]: unknown;
			}>;
			origins?: Array<{
				origin: string;
				[key: string]: unknown;
			}>;
			[key: string]: unknown;
		};

		// Validate storage state format
		if (!storageState || typeof storageState !== "object") {
			throw new Error("Invalid storage state format: must be an object");
		}

		if (!Array.isArray(storageState.cookies)) {
			throw new Error("Invalid storage state format: cookies must be an array");
		}

		// Validate cookie structure
		for (const cookie of storageState.cookies) {
			if (!cookie.name || !cookie.value || !cookie.domain) {
				throw new Error(
					"Invalid cookie format: name, value, and domain are required",
				);
			}
		}

		console.log(`✅ Authentication state loaded from ${storagePath}`);
		console.log(`   Found ${storageState.cookies.length} cookies`);

		if (storageState.origins && storageState.origins.length > 0) {
			console.log(
				`   Found ${storageState.origins.length} origin(s) with localStorage`,
			);
		}
	} catch (error) {
		console.error(`❌ Error validating storage state at ${storagePath}:`);
		console.error(error instanceof Error ? error.message : String(error));
		console.warn("   Tests will continue but may run unauthenticated");
	}
}

export default globalSetup;
