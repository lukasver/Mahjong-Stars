import fs from "node:fs/promises";
import path from "node:path";
import { DEFAULT_LOCALES } from "@mjs/i18n";
import { deepmerge } from "deepmerge-ts";

async function main() {
	const messagesDir = path.join(__dirname, "..", "messages");

	await fs.mkdir(messagesDir, { recursive: true });

	const res = await Promise.allSettled(
		DEFAULT_LOCALES.map(async (locale) => {
			const messages = await import(`@mjs/i18n/web/${locale}.json`).then(
				(m) => m.default,
			);
			const dest = path.join(messagesDir, `${locale}.json`);

			// Check if the destination file exists
			let existingMessages: Record<string, unknown> = {};
			try {
				const existingContent = await fs.readFile(dest, "utf-8");
				existingMessages = JSON.parse(existingContent) as Record<
					string,
					unknown
				>;
			} catch {
				// File doesn't exist or can't be read, use empty object
			}

			// Merge existing messages with new ones using deepmerge
			const mergedMessages = deepmerge(existingMessages, messages);

			await fs.writeFile(dest, JSON.stringify(mergedMessages, null, 2));
		}),
	);
	if (!res.every((r) => r.status === "fulfilled")) {
		console.error(
			"Failed to copy localization messages",
			JSON.stringify(res.filter((r) => r.status === "rejected")),
		);
		process.exit(1);
	}
}

try {
	main().then(() => {
		console.log("Localization messages copied");
	});
} catch (error) {
	console.error(error);
	process.exit(1);
}
