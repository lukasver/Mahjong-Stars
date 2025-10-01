import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
	createGoogleGenerativeAI,
	type GoogleGenerativeAIProvider,
} from "@ai-sdk/google";
import { type CoreMessage, generateText } from "ai";
import Handlebars from "handlebars";
import mime from "mime-types";
import type { GenerateArgs, GenerateOptions } from "./types";
import { getId } from "./utils";

/**
 * Utility class to call generative AI models.
 *
 * @example
 * ```ts
 * const generator = new Generator(process.env.GOOGLE_AI_API_KEY);
 * const result = await generator.generate(args)
 *
 */
export class Generator {
	private google: GoogleGenerativeAIProvider;

	constructor(apiKey: string) {
		this.google = createGoogleGenerativeAI({
			apiKey,
		});
	}

	async generate(args: GenerateArgs, { perf = true }: GenerateOptions) {
		const id = getId();
		if (perf) {
			console.group(`Generate: ${args.model}:`);
			console.time(`generate: #${id}`);
		}
		const messages: CoreMessage[] = args.messages || [];

		if (args.prompt) {
			messages.push({
				role: "user",
				content: [
					{
						type: "text",
						text:
							typeof args.prompt === "string"
								? args.prompt
								: await this.getPrompt(args.prompt.src, args.prompt.variables),
					},
				],
			});
		}

		if (args.documents) {
			const files = await Promise.all(
				args.documents.map(async ({ src }) => {
					const file = await this.getFile(src);
					return {
						mimeType: mime.lookup(src) || "application/octet-stream",
						data: file,
					};
				}),
			);
			messages.push({
				role: "user",
				content: files.map(({ mimeType, data }) => ({
					type: "file",
					mimeType,
					data,
				})),
			});
		}

		const result = await generateText({
			model: this.google("gemini-2.5-flash-lite"),
			// output: 'no-schema',
			messages,
			...(args.systemPrompt && {
				system:
					typeof args.systemPrompt === "string"
						? args.systemPrompt
						: await this.getPrompt(
								args.systemPrompt.text,
								args.systemPrompt.variables,
							),
			}),
			// ...(args.messages && { messages: args.messages }),
		});
		if (perf) {
			console.timeEnd(`generate: #${id}`);
			console.groupEnd();
		}

		return result;
	}

	/**
	 * Recursively searches for files in a directory matching the given extensions
	 * @param dirPath Directory path to search for files
	 * @param options.extensions Array of file extensions to filter by (e.g. ['.txt', '.md'])
	 * @param options.recursive Whether to search subdirectories recursively
	 * @returns Promise<string[]> Array of file paths matching the criteria
	 */
	async getFilesPaths(
		dirPath: string,
		{
			extensions = [],
			recursive = false,
		}: { extensions?: string[]; recursive?: boolean },
	): Promise<string[]> {
		const results: string[] = [];
		const entries = await readdir(this.getPath(dirPath), {
			withFileTypes: true,
		});
		for (const entry of entries) {
			const fullPath = this.getPath(dirPath, entry.name);
			if (entry.isDirectory()) {
				if (recursive) {
					const subFiles = await this.getFilesPaths(
						path.join(dirPath, entry.name),
						{ extensions, recursive },
					);
					results.push(...subFiles);
				}
			} else {
				if (
					extensions.length === 0 ||
					extensions.some((ext) => entry.name.endsWith(ext))
				) {
					results.push(fullPath);
				}
			}
		}
		return results;
	}

	private getPath(...segments: string[]) {
		return path.join(__dirname, ...segments);
	}

	private async getFile(path: string) {
		return readFile(this.getPath(path));
	}

	private async getPrompt(
		promptPath: string,
		variables: Record<string, string> = {},
	) {
		try {
			const prompt = await this.getFile(promptPath);
			return Handlebars.compile(prompt)(variables);
		} catch (error) {
			console.error(
				`Error getting prompt from ${promptPath}:`,
				error instanceof Error ? error.message : error,
			);
			throw error;
		}
	}
}
