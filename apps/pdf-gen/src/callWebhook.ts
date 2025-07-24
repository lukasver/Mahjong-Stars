import { request } from 'node:http';

export interface WebhookPayload {
  status: string;
  externalId: string;
  documentId: number;
}

const WEBHOOK_URL = process.env.PDF_WEBHOOK_URL!;
const WEBHOOK_API_KEY = process.env.PDF_WEBHOOK_API_KEY!;

export async function callWebhook(payload: WebhookPayload): Promise<void> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = request(
      WEBHOOK_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'x-api-key': WEBHOOK_API_KEY,
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`Webhook failed: ${res.statusCode}`));
        }
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}
