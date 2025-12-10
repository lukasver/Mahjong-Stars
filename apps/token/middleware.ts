import { type NextRequest, NextResponse } from "next/server";
import { COOKIE_PREFIX, MW_KEY } from "./common/config/constants";
import { getSessionCookie } from "./lib/auth/cookies";
import log from "./lib/services/logger.server";

const PUBLIC_ROUTES: string[] = ["/", "/onboarding", "/test", "/in"];
const _PRIVATE_ROUTES: string[] = ["/dashboard"];

const isE2ETest = process.env.E2E_TEST_MODE === "true";

export default async (req: NextRequest) => {
	log(`[MIDDLEWARE]: ${req.nextUrl.pathname}`);

	if (isE2ETest) {
		return NextResponse.next();
	}

	// if (PUBLIC_ROUTES.includes(req.nextUrl.pathname)) {
	//   return NextResponse.next();
	// }

	// This doesn't not check if the session cookie is valid, it only checks if it exists for faster perf
	const sessionCookie = await getSessionCookie(req, {
		cookiePrefix: COOKIE_PREFIX,
	});

	// If no cookie is present, we should redirect to the login page
	if (!sessionCookie) {
		if (PUBLIC_ROUTES.includes(req.nextUrl.pathname)) {
			return NextResponse.next();
		}
		return NextResponse.redirect(new URL("/", req.url));
	}

	const magicWord = req.cookies.get(`${COOKIE_PREFIX}_${MW_KEY}`);

	switch (req.nextUrl.pathname) {
		// case "/": {
		// 	if (!magicWord) {
		// 		return NextResponse.redirect(new URL("/onboarding", req.url));
		// 	}

		// 	return NextResponse.redirect(new URL("/dashboard", req.url));
		// }
		case "/dashboard":
			if (!magicWord) {
				return NextResponse.redirect(new URL("/onboarding", req.url));
			}
			return NextResponse.next();
		default:
			return NextResponse.next();
	}
};

export const config = {
	matcher: [
		"/((?!api|in|_vercel|static|sitemap|ingest|robots|manifest.webmanifest|opengraph-image|_next/static|_next/image|favicon.ico|icon*|apple-touch-*|public|static|workers|.well-known).*)",
	],
};
