import { COOKIE_NAME, COOKIE_PREFIX } from '@/common/config/constants';
import { publicUrl } from '@/common/config/env';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import 'server-only';

export const getSessionCookie = async (
  req?: NextRequest,
  opts: { cookiePrefix?: string } = {
    cookiePrefix: COOKIE_PREFIX,
  }
) => {
  let c = null;
  const cookieName = opts.cookiePrefix + COOKIE_NAME;
  if (req) {
    c = req.cookies;
  } else {
    c = await cookies();
  }
  const value = c.get(cookieName)?.value || null;
  return value;
};

export const setSessionCookie = async (
  jwt: string,
  opts: { cookiePrefix?: string } = {
    cookiePrefix: COOKIE_PREFIX,
  }
) => {
  const cookieName = opts.cookiePrefix + COOKIE_NAME;
  const c = await cookies();
  // Extract hostname from publicUrl
  const domain = new URL(publicUrl).hostname;
  console.debug('🚀 ~ cookies.ts:35 ~ domain:', domain);
  c.set(cookieName, jwt, {
    domain,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, //TODO! 30 days. Review this
    path: '/',
    sameSite: 'strict',
  });
};

export const deleteSessionCookie = async (
  opts: { cookiePrefix?: string } = {
    cookiePrefix: COOKIE_PREFIX,
  }
) => {
  const cookieName = opts.cookiePrefix + COOKIE_NAME;
  const c = await cookies();
  // Extract hostname from publicUrl to match the domain used when setting the cookie
  const domain = new URL(publicUrl).hostname;
  console.debug('🚀 ~ cookies.ts:54 ~ domain:', domain, cookieName);
  // Set the cookie with an expired date to effectively delete it
  c.set(cookieName, '', {
    domain,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0, // This expires the cookie immediately
    path: '/',
    sameSite: 'strict',
  });
};
