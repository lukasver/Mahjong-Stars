// scripts/extract-auth-state.ts
import { chromium } from "@playwright/test";
import { join } from "path";
import config from "../../../playwright.config";

async function extractAuthState() {
	// Load the Playwright config to access baseURL
	const baseURL =
		config.projects?.[0]?.use?.baseURL ||
		config.use?.baseURL ||
		`https://mjs-token-env-tests-smat-sa.vercel.app`;

	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext({
		baseURL,
		extraHTTPHeaders: {
			"x-vercel-protection-bypass":
				process.env.VERCEL_AUTOMATION_BYPASS_SECRET!,
			"x-vercel-set-bypass-cookie": "true",
		},
	});
	const page = await context.newPage();
	const outputPath = join(
		process.cwd(),
		"__tests__",
		"e2e",
		"playwright",
		".auth",
		"storage.json",
	);

	try {
		// Navigate to your app and manually log in
		await page.goto(baseURL);

		console.log("Please log in manually in the browser window...");
		console.log(
			"Press Enter after you have logged in and navigated to the dashboard",
		);

		// Wait for user to log in (you can also wait for a specific element)
		await page.waitForURL("**/dashboard", { timeout: 0 });
		console.log("Logged in successfully");
	} finally {
		// Save the storage state when browser closes (or on error)
		await context.storageState({ path: outputPath });
		console.log(`Storage state saved to ${outputPath}`);

		await browser.close();
	}
}

extractAuthState().catch(console.error);
