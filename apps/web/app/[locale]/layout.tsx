import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { PostHogProvider } from "@/components/PostHogProvider";
import { routing } from "@/lib/i18n/routing";
import "@/css/styles.css";
import { Toaster } from "@mjs/ui/primitives/sonner";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getTranslations } from "next-intl/server";
import { getLangDir } from "rtl-detect";
import Footer from "@/components/Footer";
import { siteConfig } from "@/data/config/site.settings";
import { fontClash, fontTeachers } from "../fonts";
import { genPageMetadata } from "../seo";
import { ThemeProviders } from "../theme-providers";

/**
 * Generate language alternates for SEO metadata
 */
function generateLanguageAlternates() {
	const languages: Record<string, string> = {};
	routing.locales.forEach((locale) => {
		if (locale !== routing.defaultLocale) {
			// For other locales, include the locale prefix
			languages[locale] = `/${locale}`;
		}
	});
	return languages;
}

export default async function RootLayout({
	children,
	params,
	modals,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
	modals: React.ReactNode;
}) {
	// Ensure that the incoming `locale` is valid
	const { locale } = await params;
	const direction = getLangDir(locale);
	const t = await getTranslations({
		locale: locale || "en",
		namespace: "Metadata",
	});
	if (!hasLocale(routing.locales, locale)) {
		notFound();
	}

	return (
		<html
			lang={locale || siteConfig.language}
			dir={direction}
			className={`${fontClash.variable} ${fontTeachers.variable} scroll-smooth`}
			suppressHydrationWarning
		>
			<head>
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
				<meta
					name="theme-color"
					media="(prefers-color-scheme: light)"
					content="#fff"
				/>
				<meta
					name="theme-color"
					media="(prefers-color-scheme: dark)"
					content="#000"
				/>
				{/* Video Game Microdata */}
				<meta itemProp="name" content={t("title")} />
				<meta itemProp="description" content={t("description")} />

				<meta itemProp="genre" content="Strategy Game" />
				<meta itemProp="gamePlatform" content="Web Browser" />
				<meta itemProp="gamePlatform" content="Mobile" />
				<meta itemProp="playMode" content="MultiPlayer" />
				<meta itemProp="playMode" content="SinglePlayer" />
				<meta itemProp="gameLocation" content="Online" />
				<meta itemProp="softwareVersion" content="Coming Soon" />
				<meta itemProp="datePublished" content="2025-12-31" />
				<meta itemProp="author" content={siteConfig.author} />
				<meta itemProp="publisher" content={siteConfig.author} />
				<meta itemProp="url" content={siteConfig.siteUrl} />
				<meta itemProp="image" content={`${siteConfig.siteUrl}/api/og`} />

				<link rel="alternate" type="application/rss+xml" href="/feed.xml" />
			</head>
			<body className="flex flex-col bg-white text-black antialiased dark:bg-gray-950 dark:text-white min-h-screen">
				<PostHogProvider>
					<NextIntlClientProvider>
						<ThemeProviders>
							<div className="w-full flex flex-col justify-between items-center font-sans">
								<div className="w-full flex flex-col items-center mb-auto">
									{children}
									<Footer
										className="[&>div>div]:mt-0! [&>div]:my-0!"
										locale={locale}
									/>
								</div>
								{modals}
							</div>
						</ThemeProviders>
					</NextIntlClientProvider>
				</PostHogProvider>
				{process.env.NODE_ENV === "production" && <SpeedInsights />}
				{process.env.NODE_ENV === "production" && <VercelAnalytics />}
				<Toaster position="top-center" duration={2000} />
			</body>
		</html>
	);
}

// https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing#static-rendering
export function generateStaticParams() {
	const locales = routing.locales.map((locale) => ({ locale }));
	return locales;
}

export async function generateMetadata({ params }: PageProps) {
	const { locale } = await params;
	const t = await getTranslations({
		locale: locale || "en",
		namespace: "Metadata",
	});
	return genPageMetadata({
		metadataBase: new URL(siteConfig.siteUrl),
		title: {
			default: t("title"),
			template: `%s | ${t("title")}`,
		},
		description: t("description"),
		// openGraph: {
		// 	title: t("title"),
		// 	description: t("description"),
		// 	url: "/",
		// 	siteName: t("title"),
		// 	// Commented to use opengraph-image.tsx static gen instead of api/og
		// 	// images: siteConfig.socialBanner,
		// 	locale: "en",
		// 	type: "website",
		// },
		// twitter: {
		// 	title: t("title"),
		// 	description: t("description"),
		// 	card: "summary_large_image",
		// 	// Commented to use opengraph-image.tsx static gen instead of api/og
		// 	// images: siteConfig.socialBanner,
		// },
		alternates: {
			canonical: "/",
			types: {
				"application/rss+xml": `${siteConfig.siteUrl}/feed.xml`,
			},
			languages: generateLanguageAlternates(),
		},
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
				"max-video-preview": -1,
				"max-image-preview": "large",
				"max-snippet": -1,
			},
		},

	})
};
