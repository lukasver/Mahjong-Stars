import { env } from '@/common/config/env';
import { invariant } from '@epic-web/invariant';
import logger from '@/lib/services/logger.server';
import sales from '@/lib/repositories/sales';

const handler = async (req: Request) => {
  try {
    const apiKey = req.headers.get('Authorization');
    invariant(apiKey, 'API key is required');
    const [type, token] = apiKey.split(' ');
    invariant(type === 'Bearer', 'Invalid API key');
    invariant(token === env.CRON_SECRET, 'Invalid API key');

    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      return Response.json(
        { success: false, message: 'Not implemented' },
        { status: 501 }
      );
    }

    if (req.method === 'GET') {
      await sales.crons.cleanUp();
      return Response.json({ success: true, message: 'OK' }, { status: 200 });
    }

    return Response.json(
      { success: false, message: 'Bad request' },
      { status: 400 }
    );
  } catch (e: unknown) {
    logger(e);
    return Response.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }
};

export const GET = handler;
