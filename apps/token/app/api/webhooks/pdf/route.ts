import { env } from '@/common/config/env';
import { DocumentSignatureStatusSchema } from '@/common/schemas/generated';
import { prisma } from '@/lib/db/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const API_KEY = env.PDF_WEBHOOK_API_KEY;

const successSchema = z.object({
  externalId: z.number(),
  status: z.string(),
  documentId: z.string(),
});
const errorSchema = z.object({
  error: z.string(),
  documentId: z.string(),
});
const bodySchema = z.union([successSchema, errorSchema]);

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON or Payload' },
      { status: 400 }
    );
  }

  try {
    const parsed = successSchema.safeParse(body);

    if (parsed.success) {
      const status =
        mappingStatus[parsed.data.status as keyof typeof mappingStatus] ||
        DocumentSignatureStatusSchema.enum.SENT_FOR_SIGNATURE;

      await prisma.documentRecipient.update({
        where: { id: parsed.data.documentId },
        data: { status, externalId: parsed.data.externalId },
      });
    } else {
      if (body.documentId) {
        await prisma.documentRecipient.update({
          where: { id: body.documentId },
          data: { status: 'ERROR' },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: 'Webhook internal error', details: String(err) },
      { status: 500 }
    );
  }
}

const mappingStatus = {
  DRAFT: DocumentSignatureStatusSchema.enum.CREATED,
  PENDING: DocumentSignatureStatusSchema.enum.SENT_FOR_SIGNATURE,
  COMPLETED: DocumentSignatureStatusSchema.enum.SIGNED,
  REJECTED: DocumentSignatureStatusSchema.enum.REJECTED,
} as const;
