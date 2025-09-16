import { type IncomingMessage, type ServerResponse } from "node:http";
import * as z from "zod/v4-mini";
import { callWebhook } from "./callWebhook.js";
import { generatePdf } from "./generate.js";
import { checkAuth } from "./guard.js";
import docService from "./signature.js";

const bodySchema = z.object({
	content: z.string(),
	title: z.string(),
	recipients: z.array(
		z.object({
			email: z.string(),
			name: z.optional(z.string()),
		}),
	),
	reference: z.string(),
});

/**
 * Main entry point for handling PDF generation and document signing requests.
 * Performs API key authorization before processing requests.
 * @param req - Incoming HTTP request
 * @param res - Server response
 */
async function main(req: IncomingMessage, res: ServerResponse) {
	// Set CORS headers
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization, X-Requested-With, X-API-Key",
	);
	res.setHeader("Access-Control-Allow-Credentials", "true");

	// Handle preflight requests
	if (req.method === "OPTIONS") {
		res.writeHead(200);
		res.end();
		return;
	}

	if (req.method === "GET") {
		res.writeHead(200, { "Content-Type": "text/plain" });
		res.end(JSON.stringify({ success: true }));
		return;
	}

	// Only accept POST requests
	if (req.method !== "POST") {
		res.writeHead(405, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ success: false, error: "Method not allowed" }));
		return;
	}

	// --- API Key Authorization ---
	const apiKey = req.headers["x-api-key"];
	if (
		!checkAuth(
			typeof apiKey === "string"
				? apiKey
				: Array.isArray(apiKey)
					? apiKey[0]
					: "",
		)
	) {
		res.writeHead(401, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ success: false, error: "Unauthorized" }));
		return;
	}

	const start = performance.now();

	// Get parsed body
	const parsed = bodySchema.safeParse(await parseJsonBody(req));

	try {
		if (!parsed.success) {
			res.writeHead(400, { "Content-Type": "application/json" });
			res.end(
				JSON.stringify({ success: false, error: "Invalid request body" }),
			);

			return;
		}
		const body = parsed.data;

		console.log(`Starting PDF generation...`);
		console.time("PDF generated");
		const { pageCount, buffer } = await generatePdf(body.content);
		console.timeEnd(`PDF generated`);

		console.log(`Starting document creation with provider...`);
		console.time("document-creation");
		// Create documenti n provider and send
		const document = await docService.createDocumentInProvider({
			title: body.title || "PDF Document",
			recipients: body.recipients,
			file: buffer,
			pageSize: pageCount,
			reference: body.reference,
		});
		console.timeEnd(`document-creation`);
		if (!document.documentId) {
			throw new Error("Failed to create document in provider");
		}

		console.log(`Starting document sending for signing...`);
		console.time("document-sending");
		await docService.sendForDocumentSigning(document.documentId).then((res) => {
			if (res) {
				console.debug("RESULT", res);
				return callWebhook({
					externalId: document.documentId,
					status: res.status,
					documentId: res.externalId || body.reference,
				}).catch((err) => {
					console.error(
						`Error calling webhook for doc ${document.documentId} with reference ${body.reference}: `,
						err?.message,
					);
				});
			}
		});
		console.timeEnd(`document-sending`);
		// call webhook

		console.log(
			`[${new Date().toISOString()}] PDF generation completed in ${((performance.now() - start) / 1000).toFixed(2)}s`,
		);
		res.writeHead(200, {
			"Content-Type": "application/json",
			"X-Page-Count": pageCount.toString(),
		});
		res.end(JSON.stringify({ success: true }));
	} catch (error) {
		console.error("Error generating PDF:", error);
		if (parsed.data) {
			// clal the webhook to update the status of the document ot errored
			callWebhook({
				documentId: parsed.data.reference,
				error:
					error instanceof Error
						? error.message
						: "Unknown error generating PDF",
			}).catch((err) => {
				console.error(
					`Error calling webhook for doc ${parsed.data.reference}: `,
					err?.message,
				);
			});
		}
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ success: false, error: "Internal server error" }));
	} finally {
		const end = performance.now();
		console.log(`Code run in ${((end - start) / 1000).toFixed(2)}s`);
	}
}

async function parseJsonBody(req: IncomingMessage): Promise<unknown> {
	return new Promise((resolve, reject) => {
		let data = "";

		req.on("data", (chunk) => {
			data += chunk;
		});

		req.on("end", () => {
			try {
				resolve(JSON.parse(data));
			} catch (error) {
				console.error(error);
				reject(new Error("Invalid JSON"));
			}
		});

		req.on("error", (error) => {
			reject(error);
		});
	});
}

export default main;
