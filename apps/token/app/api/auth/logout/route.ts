import { publicUrl } from '@/common/config/env';
import { deleteSessionCookie } from '@/lib/auth/cookies';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

// Your frontend's address: http://localhost:3000 or https://my.production.domain.com

export async function GET(req: NextRequest) {
  const redirectTo = req.nextUrl.searchParams.get('redirectTo') as
    | string
    | undefined;
  // Tell Next.js to purge the entire cache, no stale data should stay after the redirect back to the index page.
  revalidatePath('/', 'layout');
  revalidatePath('/dashboard', 'layout');

  // You can redirect back to the index, or to another page such as /login
  const destination = new URL(redirectTo || '/', publicUrl).toString();

  // Clear the session cookie explicitly. Generally this can be done by just
  // using Set-Cookie: <cookie-name>=; but Next.js gives us an API to do it.
  await deleteSessionCookie();

  return NextResponse.redirect(destination, {
    headers: {
      // Some browsers accept this directive to clear cookies and other data.
      'Clear-Site-Data': `"*"`,
      // Next.js accepts this directive to clear its own client fetch cache.
      'Cache-Control': 'no-store',
    },
  });
}
