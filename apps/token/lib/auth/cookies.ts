import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { COOKIE_NAME, COOKIE_PREFIX } from "@/common/config/constants";
import { publicUrl } from "@/common/config/env";
import "server-only";

/**
 * Determines the appropriate domain for cookie setting based on the environment
 */
const getCookieDomain = (url: string): string | undefined => {
	const hostname = new URL(url).hostname;

	// For Vercel preview deployments, don't set domain to allow subdomain flexibility
	if (hostname.includes(".vercel.app")) {
		return undefined; // This allows the cookie to work on the exact domain
	}

	// For custom domains, extract the root domain
	if (hostname.includes(".")) {
		const parts = hostname.split(".");
		// For domains like app.yourdomain.com, return yourdomain.com
		if (parts.length > 2) {
			return parts.slice(-2).join(".");
		}
		return hostname;
	}

	return hostname;
};

export const getSessionCookie = async (
	req?: NextRequest,
	opts: { cookiePrefix?: string } = {
		cookiePrefix: COOKIE_PREFIX,
	},
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
	},
) => {
	const cookieName = opts.cookiePrefix + COOKIE_NAME;
	const c = await cookies();
	// Extract hostname from publicUrl
	const domain = getCookieDomain(publicUrl);

	console.log("🚀 ~ cookies.ts:59 ~ domain:", domain);

	c.set(cookieName, jwt, {
		domain,
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		maxAge: 60 * 60 * 24 * 30, //TODO! 30 days. Review this
		path: "/",
		sameSite: "strict",
	});
};

export const deleteSessionCookie = async (
	opts: { cookiePrefix?: string } = {
		cookiePrefix: COOKIE_PREFIX,
	},
) => {
	const cookieName = opts.cookiePrefix + COOKIE_NAME;
	const c = await cookies();
	// Extract hostname from publicUrl to match the domain used when setting the cookie
	const domain = new URL(publicUrl).hostname;
	// Set the cookie with an expired date to effectively delete it
	c.set(cookieName, "", {
		domain,
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		maxAge: 0, // This expires the cookie immediately
		path: "/",
		sameSite: "strict",
	});
};
