import { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./lib/i18n/routing";

export default (req: NextRequest) => {
	if (process.env.NODE_ENV === "development") {
		console.log("\x1b[31m[MIDDLEWARE]", req.nextUrl.pathname, "\x1b[0m");
	}
	return createMiddleware(routing)(req);
};

export const config = {
	// Match all pathnames except for
	// - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
	// - … the ones containing a dot (e.g. `favicon.ico`)
	matcher:
		"/((?!api|static|sitemap|ingest|_next|_vercel|opengraph-image|robots|manifest.webmanifest|.*\\..*).*)",
};
