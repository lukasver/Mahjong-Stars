import { env } from '@/common/config/env';
import { hasActiveSession } from '@/lib/actions';
import { deleteSessionCookie, getSessionCookie } from '@/lib/auth/cookies';
import { verifyJwt } from '@/lib/auth/thirdweb';
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
      let error = 'Internal server error';
      if (e instanceof Error && env.IS_DEV) {
        error += ': ' + e.message;
      }
      return new NextResponse(JSON.stringify({ error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}
