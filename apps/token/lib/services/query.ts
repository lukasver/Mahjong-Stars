import { isServer, QueryClient } from "@tanstack/react-query";
import { DEFAULT_STALE_TIME } from "@/common/config/constants";

let browserQueryClient: QueryClient | undefined = undefined;

// This code is only for TypeScriptdeclare global {
declare global {
	interface Window {
		__TANSTACK_QUERY_CLIENT__: // @ts-expect-error wontfix
		import("@tanstack/query-core").QueryClient;
	}
}

export function getQueryClient() {
	if (isServer) {
		// Server: always make a new query client
		return makeQueryClient();
	} else {
		// Browser: make a new query client if we don't already have one
		// This is very important, so we don't re-make a new client if React
		// suspends during the initial render. This may not be needed if we
		// have a suspense boundary BELOW the creation of the query client
		if (!browserQueryClient) browserQueryClient = makeQueryClient();
		if (process.env.NODE_ENV === "development") {
			window.__TANSTACK_QUERY_CLIENT__ = browserQueryClient;
		}
		return browserQueryClient;
	}
}

function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				// With SSR, we usually want to set some default staleTime
				// above 0 to avoid refetching immediately on the client
				staleTime: DEFAULT_STALE_TIME,
			},
		},
	});
}
