import type { Metadata, Viewport } from "next";
import { fontClash, fontTeachers } from "./fonts";
import "./styles.css";
import { Toaster } from "@mjs/ui/primitives/sonner";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import { metadata as siteConfig } from "@/common/config/site";
import { VercelToolbar } from "@/components/admin/vercel-toolbar";
import { CookieConsent } from "@/components/cookie-consent";
import { getCurrentUser } from "@/lib/services/fetchers.server";
import packageJson from "../package.json";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: "./",
    siteName: siteConfig.title,
    // Commented to use opengraph-image.tsx static gen instead of api/og
    // images: [siteConfig.socialBanner],
    locale: "en",
    type: "website",
  },
  alternates: {
    canonical: "./",
    types: {
      "application/rss+xml": `${siteConfig.siteUrl}/feed.xml`,
    },
    // languages: {
    //   en: '/',
    // },
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
  twitter: {
    title: siteConfig.title,
    card: "summary_large_image",
    // Commented to use opengraph-image.tsx static gen instead of api/og
    // images: [siteConfig.socialBanner],
  },
};

export const viewport: Viewport = {
  themeColor: "#4a0000",
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  const deploymentId =
    process.env.VERCEL_GIT_COMMIT_SHA || packageJson.version || "unknown";
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${fontClash.variable} ${fontTeachers.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme={siteConfig.theme}
          enableColorScheme
          enableSystem={false}
        >
          <NextIntlClientProvider messages={messages}>
            <Providers deploymentId={deploymentId}>
              {children}
              <Toaster />
              {process.env.NODE_ENV === "production" && <VercelAnalytics />}
            </Providers>
            <CookieConsent />
          </NextIntlClientProvider>
          <Suspense fallback={null}>
            <VercelToolbarRSC />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}

const VercelToolbarRSC = async () => {
  const res = await getCurrentUser(false);
  if (!res?.data) return null;
  return <VercelToolbar roles={res.data?.roles} />;
};
