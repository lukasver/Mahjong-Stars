import { request } from "node:http";
import { request as secureRequest } from "node:https";

export interface WebhookErrorPayload {
	error: string;
	documentId: string;
}

export interface WebhookPayload {
	status: string;
	externalId: number;
	documentId: string;
}

const WEBHOOK_URL = process.env.PDF_WEBHOOK_URL!;
const WEBHOOK_API_KEY = process.env.PDF_WEBHOOK_API_KEY!;
const VERCEL_AUTOMATION_BYPASS_SECRET =
	process.env.VERCEL_AUTOMATION_BYPASS_SECRET!;

let toCall = request;
if (process.env.PDF_WEBHOOK_URL?.startsWith("https://")) {
	toCall = secureRequest;
}

export async function callWebhook(
	payload: WebhookPayload | WebhookErrorPayload,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const data = JSON.stringify(payload);
		const req = toCall(
			WEBHOOK_URL,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Content-Length": Buffer.byteLength(data),
					"x-api-key": WEBHOOK_API_KEY,
					"x-vercel-protection-bypass": VERCEL_AUTOMATION_BYPASS_SECRET,
				},
			},
			(res) => {
				if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
					resolve();
				} else {
					reject(new Error(`Webhook failed: ${res.statusCode}`));
				}
			},
		);
		req.on("error", reject);
		req.write(data);
		req.end();
	});
}
