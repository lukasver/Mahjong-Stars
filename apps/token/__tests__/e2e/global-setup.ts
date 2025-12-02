import { FullConfig } from "@playwright/test";
import { execSync } from "child_process";
import { existsSync, readFileSync, statSync } from "fs";
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

	const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 1 day in milliseconds
	let shouldExtractAuth = false;

	// Check if file doesn't exist
	if (!existsSync(storagePath)) {
		console.log(`⚠️  Authentication state file not found at ${storagePath}`);
		shouldExtractAuth = true;
	} else {
		// Check if file is older than 1 day
		const stats = statSync(storagePath);
		const fileAge = Date.now() - stats.mtimeMs;
		if (fileAge > ONE_DAY_MS) {
			console.log(
				`⚠️  Authentication state file is older than 1 day (${Math.round(fileAge / ONE_DAY_MS)} days old)`,
			);
			shouldExtractAuth = true;
		}
	}

	// Run auth extraction if needed
	if (shouldExtractAuth) {
		console.log("🔄 Running authentication state extraction...");
		try {
			execSync("pnpm run e2e:extract-auth-state", {
				stdio: "inherit",
				cwd: process.cwd(),
			});
			console.log("✅ Authentication state extraction completed");
		} catch (error) {
			console.error("❌ Failed to extract authentication state:");
			console.error(error instanceof Error ? error.message : String(error));
			console.warn("   Tests will continue but may run unauthenticated");
			return;
		}
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
