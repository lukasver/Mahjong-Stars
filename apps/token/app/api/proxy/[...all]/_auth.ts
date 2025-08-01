import { env } from '@/common/config/env';
import { hasActiveSession } from '@/lib/actions';
import { isAdmin } from '@/lib/actions/admin';
import { deleteSessionCookie, getSessionCookie } from '@/lib/auth/cookies';
import { verifyJwt } from '@/lib/auth/thirdweb';
import { NextRequest, NextResponse } from 'next/server';

export function withAuth(
  handler: (
    req: NextRequest,
    context: { params: Promise<{ all: string[] }> },
    auth: {
      address: string;
      jwt: string;
      isAdmin: boolean;
      userId: string | undefined;
    }
  ) => Promise<Response> | Response
) {
  return async (
    req: NextRequest,
    context: { params: Promise<{ all: string[] }> }
  ) => {
    try {
      const jwt = await getSessionCookie();

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
      const [_authed, _isAdmin] = await Promise.allSettled([
        hasActiveSession(address, jwt),
        isAdmin(address),
      ]);

      let authed = false;
      if (_authed.status === 'fulfilled') {
        authed = _authed.value;
      }
      let isAdminUser = false;
      let userId: string | undefined = undefined;
      if (_isAdmin.status === 'fulfilled') {
        isAdminUser = !!_isAdmin.value;
        userId = _isAdmin?.value?.id;
      }

      if (!authed) {
        await deleteSessionCookie();
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // Call the handler with auth info
      return handler(req, context, {
        address,
        jwt,
        isAdmin: isAdminUser,
        userId,
      });
    } catch (e) {
      let error = 'Internal server error';
      if (e instanceof Error && env.IS_DEV) {
        error += ': ' + e.message;
      }
      console.error('API MIDDLEWARE', error);
      return new NextResponse(JSON.stringify({ error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}
