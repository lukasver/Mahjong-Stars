import { env } from '@/common/config/env';
import { invariant } from '@epic-web/invariant';
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/services/logger.server';
import tx from '@/lib/repositories/transactions';
import sales from '@/lib/repositories/sales';
import users from '@/lib/repositories/users';

const TYPE = {
  transactionsCleanup: 'transactions-cleanup',
  salesCleanup: 'sales-cleanup',
  sessionsCleanup: 'sessions-cleanup',
} as const;

const handler = async (req: NextRequest) => {
  try {
    const apiKey = req.headers.get('Authorization');
    invariant(apiKey, 'API key is required');
    const [type, token] = apiKey.split(' ');
    invariant(type === 'Bearer', 'Invalid API key');
    invariant(token === env.CRON_SERVICE_API_KEY, 'Invalid API key');

    if (['GET', 'PUT', 'DELETE'].includes(req.method)) {
      return NextResponse.json(
        { success: false, message: 'Not implemented' },
        { status: 501 }
      );
    }

    if (req.method === 'POST') {
      let body: {
        type: (typeof TYPE)[keyof typeof TYPE];
        data: any;
      };
      try {
        body = (await req.json()) as unknown as typeof body;
      } catch (e) {
        logger(e);
        return NextResponse.json(
          { success: false, message: 'Bad request' },
          { status: 400 }
        );
      }
      const { type, data } = body || {};
      invariant(type, 'type is required');

      switch (type) {
        case TYPE.transactionsCleanup:
          await tx.crons.cleanUp();
          break;
        case TYPE.salesCleanup:
          await sales.crons.cleanUp();
          break;
        case TYPE.sessionsCleanup:
          await users.crons.cleanUp(data?.type || 'all');
          break;
      }
      return NextResponse.json(
        { success: true, message: 'OK' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Bad request' },
      { status: 400 }
    );
  } catch (e: unknown) {
    logger(e);
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }
};

export const GET = handler;
export const POST = handler;
