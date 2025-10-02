import { Head } from "nextra/components";
// import 'nextra-theme-docs/style.css';
import "@/app/styles.css";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { Metadata } from "next";
import { unstable_ViewTransition as ViewTransition } from "react";
import { PostHogProvider } from "@/components/posthog-provider";

import { metadata as siteConfig } from "@/lib/site-config";
import { fontClash, fontTeachers } from "./fonts";
import { genPageMetadata } from "./seo";

export const metadata: Metadata = genPageMetadata({
	title: siteConfig.title,
	description: siteConfig.description,
	verification: {
		google: "nqa5sg-1E3L1kkp14czB6bPMFch0O0qwUt1OLHme3lo",
		yahoo: 'FF50A7E49E3FA26ACB3E48EF51D8D106',
		// yandex: '',
		other: {
			// Bing
			"msvalidate.01": ['FF50A7E49E3FA26ACB3E48EF51D8D106']
		}
	},
});

export const generateStaticParams = async () => {
	const paths = await import("@/lib/i18n").then((m) => m.i18n.locales);
	return paths.map((locale) => ({ lang: locale }));
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			// Not required, but good for SEO
			lang={"en"}
			// Required to be set
			dir={"ltr"}
			// Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
			suppressHydrationWarning
			className={`${fontClash.variable} ${fontTeachers.variable} scroll-smooth`}
		>
			<Head>
				{/* Your additional tags should be passed as `children` of `<Head>` element */}
				<link
					rel="apple-touch-icon"
					sizes="76x76"
					href="/static/favicons/apple-touch-icon.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="32x32"
					href="/static/favicons/favicon-32x32.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="16x16"
					href="/static/favicons/favicon-16x16.png"
				/>
				<link rel="manifest" href="/static/favicons/manifest.webmanifest" />
				<link
					rel="mask-icon"
					href="/static/favicons/safari-pinned-tab.svg"
					color="#4a0000"
				/>
				<meta name="generator" content="Shipixen" />
				<meta name="msapplication-TileColor" content="#000000" />
				<link rel="alternate" type="application/rss+xml" href="/feed.xml" />
			</Head>
			<body>
				<PostHogProvider>
					<ViewTransition>{children}</ViewTransition>
				</PostHogProvider>
				{process.env.NODE_ENV === "production" && <VercelAnalytics />}
				{/* {process.env.NODE_ENV === 'production' && <SpeedInsights />} */}
			</body>
		</html>
	);
}
