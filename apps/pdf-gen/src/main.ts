import { type ServerResponse, type IncomingMessage } from 'node:http';
import { generatePdf } from './generate.js';
import docService from './signature.js';

import * as z from 'zod/v4-mini';
import { callWebhook } from './callWebhook.js';
import { checkAuth } from './guard.js';

const bodySchema = z.object({
  content: z.string(),
  title: z.string(),
  recipients: z.array(
    z.object({
      email: z.string(),
      name: z.optional(z.string()),
    })
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
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method not allowed');
    return;
  }

  // --- API Key Authorization ---
  const apiKey = req.headers['x-api-key'];
  if (
    !checkAuth(
      typeof apiKey === 'string'
        ? apiKey
        : Array.isArray(apiKey)
          ? apiKey[0]
          : ''
    )
  ) {
    res.writeHead(401, { 'Content-Type': 'text/plain' });
    res.end('Unauthorized');
    return;
  }

  const start = performance.now();

  try {
    // Get parsed body
    const parsed = bodySchema.safeParse(await parseJsonBody(req));

    if (!parsed.success) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Invalid request body');

      return;
    }
    const body = parsed.data;
    console.debug('🚀 ~ main.ts:44 ~ main ~ body:', body);

    // res.end('ok');
    // return;

    console.log(`Starting PDF generation...`);
    console.time('PDF generated');
    const { pageCount, buffer } = await generatePdf(body.content);
    console.timeEnd(`PDF generated`);

    console.log(`Starting document creation with provider...`);
    console.time('document-creation');
    // Create documenti n provider and send
    const document = await docService.createDocumentInProvider({
      title: body.title || 'PDF Document',
      recipients: body.recipients,
      file: buffer,
      pageSize: pageCount,
      reference: body.reference,
    });
    console.timeEnd(`document-creation`);
    if (!document.documentId) {
      throw new Error('Failed to create document in provider');
    }

    console.log(`Starting document sending for signing...`);
    console.time('document-sending');
    await docService.sendForDocumentSigning(document.documentId).then((res) => {
      if (res) {
        return callWebhook({
          externalId: res.externalId || body.reference,
          status: res.status,
          documentId: document.documentId,
        }).catch((err) => {
          console.error(
            `Error calling webhook for doc ${document.documentId} with reference ${body.reference}: `,
            err?.message
          );
        });
      }
    });
    console.timeEnd(`document-sending`);
    // call webhook

    console.log(
      `[${new Date().toISOString()}] PDF generation completed in ${((performance.now() - start) / 1000).toFixed(2)}s`
    );
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'X-Page-Count': pageCount.toString(),
    });
    res.end('OK');
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal server error');
  } finally {
    const end = performance.now();
    console.log(`Code run in ${((end - start) / 1000).toFixed(2)}s`);
  }
}

async function parseJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        console.error(error);
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', (error) => {
      reject(error);
    });
  });
}

export default main;
