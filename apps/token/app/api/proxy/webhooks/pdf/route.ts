// apps/token/app/api/webhooks/pdf-status/route.ts
import { prisma } from '@/lib/db/prisma';
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.PDF_WEBHOOK_API_KEY || 'lalala';

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { reference?: string; status?: string; documentId?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.reference || !body.status) {
    return NextResponse.json(
      { error: 'Missing reference or status' },
      { status: 400 }
    );
  }

  try {
    await prisma.documentRecipient.update({
      where: { id: body.reference },
      data: { status: body.status, externalId: body.documentId },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: 'DB update failed', details: String(err) },
      { status: 500 }
    );
  }
}
