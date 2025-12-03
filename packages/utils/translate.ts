import fs from "node:fs/promises";
import {
	createGoogleGenerativeAI,
	type GoogleGenerativeAIProvider,
} from "@ai-sdk/google";
import {
	type CoreMessage,
	type FilePart,
	generateText,
	type ImagePart,
	type TextPart,
} from "ai";
import { saveFile } from "./files.js";

// Function to translate and save the output
export async function translateAndSave(
	language: string,
	prompt: string,
	sourceFile: string | null,
	destinationFile?: string,
	{ perf, mimeType }: { perf?: boolean; mimeType?: string } = {
		perf: true,
		mimeType: "text/plain",
	},
) {
	try {
		const messages: CoreMessage[] = [
			{
				role: "user",
				content: [
					{
						type: "text",
						text: `Translate the following documentfrom English to "${language}" locale language`,
					},
				],
			},
		];
		const file = sourceFile ? await fs.readFile(sourceFile) : null;
		if (file) {
			const content = messages[0]?.content as (
				| TextPart
				| ImagePart
				| FilePart
			)[];
			if (content) {
				content.push({
					type: "file",
					data: file,
					mediaType: mimeType || `text/plain`,
				});
			}
		}
		const start = performance.now();
		const result = await generateText({
			model: createGoogleGenerativeAI({
				apiKey: process.env.GOOGLE_AI_API_KEY,
			})("gemini-2.5-flash-lite"),
			// output: 'no-schema',
			system: prompt,
			messages,
		});
		const translatedText = result.text;

		if (destinationFile) {
			await saveFile(destinationFile, translatedText);
		}

		if (perf) {
			const end = performance.now();
			console.group(`========= ${sourceFile} performance =========`);
			console.info(`Translation took ${Math.round((end - start) / 1000)}s`);
			console.info(`Prompt used ${result.usage?.inputTokens} tokens`);
			console.info(`Completion used ${result.usage?.outputTokens} tokens`);
			console.info(`Total used ${result.usage?.totalTokens} tokens`);
			console.groupEnd();
		}

		return translatedText;
	} catch (error) {
		console.error(`Error translating ${sourceFile}:`, error);
	}
}

export class Translator {
	private google: GoogleGenerativeAIProvider;

	constructor(apiKey: string) {
		this.google = createGoogleGenerativeAI({
			apiKey,
		});
	}

	async translateAndSave(
		language: string,
		prompt: string,
		sourceFile: string | null,
		destinationFile?: string,
		{ perf, mimeType }: { perf?: boolean; mimeType?: string } = {
			perf: true,
			mimeType: "text/plain",
		},
	) {
		try {
			const messages: CoreMessage[] = [
				{
					role: "user",
					content: [
						{
							type: "text",
							text: `Translate the following documentfrom English to "${language}" locale language`,
						},
					],
				},
			];
			const file = sourceFile ? await fs.readFile(sourceFile) : null;
			if (file) {
				const content = messages[0]?.content as (
					| TextPart
					| ImagePart
					| FilePart
				)[];
				if (content) {
					content.push({
						type: "file",
						data: file,
						mediaType: `text/plain`,
					});
				}
			}
			const start = performance.now();
			const result = await generateText({
				model: this.google("gemini-2.5-flash-lite"),
				// output: 'no-schema',
				system: prompt,
				messages,
			});
			const translatedText = this.cleanText(
				result.text,
				mimeType?.split("/")[1],
			);

			if (destinationFile) {
				await saveFile(destinationFile, translatedText);
			}

			if (perf) {
				const end = performance.now();
				console.group(`========= ${sourceFile} performance =========`);
				console.info(`Translation took ${Math.round((end - start) / 1000)}s`);
				console.info(`Prompt used ${result.usage?.inputTokens} tokens`);
				console.info(`Completion used ${result.usage?.outputTokens} tokens`);
				console.info(`Total used ${result.usage?.totalTokens} tokens`);
				console.groupEnd();
			}

			return translatedText;
		} catch (error) {
			console.error(
				`Error translating ${sourceFile}:`,
				error instanceof Error ? error.message : error,
			);
			throw error;
		}
	}

	private getExtension(extension: string): string {
		switch (extension) {
			case "text":
				return "```txt";
			case "md":
				return "```md";
			case "mdx":
				return "```mdx";
			case "json":
				return "```json";
			default:
				return "```txt";
		}
	}

	/**
	 * Useful for removing the wrapping codeblocks or backticks.
	 */
	cleanText(content: string, extension: string | undefined): string {
		const lines = content.split("\n");

		if (lines.length === 0) {
			return content;
		}

		let startIndex = 0;
		let endIndex = lines.length - 1;

		// Check if first line is a code fence
		const firstLine = lines[0]?.trim();

		if (
			(extension && firstLine === this.getExtension(extension)) ||
			firstLine?.includes("```")
		) {
			startIndex = 1;
		}

		// Check if first line starts with "title" and needs frontmatter delimiter
		if (firstLine?.startsWith("title:")) {
			lines.unshift("---");
			startIndex = 0;
		}

		// Find the actual last line by skipping trailing empty lines
		while (endIndex >= 0 && lines[endIndex]?.trim() === "") {
			endIndex--;
		}

		// Check if last non-empty line is a code fence
		const lastLine = lines[endIndex]?.trim();
		if (lastLine === "```") {
			endIndex--;
		}

		// Only rewrite the file if we found changes to make
		if (startIndex > 0 || endIndex < lines.length - 1 || lines[0] === "---") {
			const cleanedContent = lines.slice(startIndex, endIndex + 1).join("\n");
			// await writeFile(filePath, cleanedContent);
			return cleanedContent;
		}
		return content;
	}
}
