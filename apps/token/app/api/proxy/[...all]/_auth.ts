import { hasActiveSession } from '@/lib/actions';
import {
  deleteSessionCookie,
  getSessionCookie,
  verifyJwt,
} from '@/lib/auth/thirdweb';
import { NextRequest, NextResponse } from 'next/server';

export function withAuth(
  handler: (
    req: NextRequest,
    context: { params: Promise<{ all: string[] }> },
    auth: { address: string; jwt: string }
  ) => Promise<Response> | Response
) {
  return async (
    req: NextRequest,
    context: { params: Promise<{ all: string[] }> }
  ) => {
    try {
      const jwt = await getSessionCookie();

      console.log('req.url', req.url, 'Hay jwt?', !!jwt);
      if (!jwt) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const res = await verifyJwt(jwt);
      if (!res.valid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const address = res.parsedJWT.sub;
      if (!address) {
        return NextResponse.json({ error: 'Invalid address' }, { status: 401 });
      }
      const authed = await hasActiveSession(address, jwt);

      if (!authed) {
        await deleteSessionCookie();
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // Call the handler with auth info
      return handler(req, context, { address, jwt });
    } catch (e) {
      console.debug(
        '_auth.ts:44 ~ catch ~ error:',
        e instanceof Error ? e.message : e
      );
      return new NextResponse(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}
