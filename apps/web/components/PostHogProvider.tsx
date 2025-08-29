"use client";

import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import {
	PostHogProvider as PHProvider,
	usePostHog as usePostHogHook,
} from "posthog-js/react";
import { Suspense, useCallback, useEffect } from "react";
import { environment, name } from "../data/app-info";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
			autocapture: process.env.NODE_ENV === "production",
			loaded: function (ph) {
				if (process.env.NODE_ENV === "development") {
					ph.opt_out_capturing(); // opts a user out of event capture
					ph.set_config({ disable_session_recording: true });
				}
			},
			api_host: "/ingest",
			ui_host: "https://eu.posthog.com",
			capture_pageview: false, // We capture pageviews manually
			capture_pageleave: true, // Enable pageleave capture
			// debug: process.env.NODE_ENV === 'development',
			capture_exceptions: true, // This enables capturing exceptions using Error Tracking, set to false if you don't want this
		});
	}, []);

	return (
		<PHProvider client={posthog}>
			<SuspendedPostHogPageView />
			{children}
		</PHProvider>
	);
}

function PostHogPageView() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const posthog = usePostHogHook();

	useEffect(() => {
		if (pathname && posthog) {
			let url = window.origin + pathname;
			const search = searchParams.toString();
			if (search) {
				url += "?" + search;
			}
			posthog.capture("$pageview", {
				$current_url: url,
				app: "@mjs/web",
				environment: process.env.NODE_ENV,
			});
		}
	}, [pathname, searchParams, posthog]);

	return null;
}

function SuspendedPostHogPageView() {
	return (
		<Suspense fallback={null}>
			<PostHogPageView />
		</Suspense>
	);
}

export const PostHogEvents = {
	login: "login",
	register: "register",
	contactFormSubmit: "submited_contact_form",
	newsletterSubscribe: "subscribed_to_newsletter",
	newsletterUnsubscribe: "unsubscribed_from_newsletter",
	claimQuest: "claimed_quest",
} as const;

type PostHogEvent = (typeof PostHogEvents)[keyof typeof PostHogEvents];

type PostHogProperties = {
	environment: "development" | "production" | "test";
	app: "@mjs/web";
	[key: string]: string | number | boolean;
};

export function usePostHog() {
	const posthog = usePostHogHook();

	// const { status, data } = useSession()

	const captureEvent = useCallback(
		(event: PostHogEvent, properties: Partial<PostHogProperties> = {}) => {
			try {
				// const user = data?.user
				posthog.capture(event, {
					...properties,
					environment: environment,
					app: name,
					// ...(user && {
					//   email: user.email,
					//   sub: user.sub,
					// }),
				});
			} catch (e) {
				console.error(e instanceof Error ? e.message : "Unknown Posthog error");
			}
		},
		[posthog],
	);

	return { captureEvent, posthog, PostHogEvents } as const;
}
