import { publicUrl } from "./env";

const metadata = {
	title: "$TILE – Empowering Mahjong on Web3",
	description:
		"$TILE is the core utility token of MJS, enabling NFT trading, AI upgrades, tournament access, and revenue staking. Participate in a multi-billion dollar Web3 opportunity and fuel the first global social mahjong platform with real-world value and AI liquidity.",
	domain: "thetilescompany.io",
	logoTitle: "The Tiles Company",
	businessName: "The Tiles Company",
	siteUrl: publicUrl,
	siteRepo: "",
	socialBanner: "/api/og",
	tokenSymbol: "TILE",
	tokenName: "TILES",
	supportEmail:
		process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "info@thetilescompany.io",
	twitter: process.env.NEXT_PUBLIC_TWITTER_HANDLE || "",
	instagram: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || "",
	tiktok: process.env.NEXT_PUBLIC_TIKTOK_HANDLE || "",
	discord: process.env.NEXT_PUBLIC_DISCORD_INVITE || "",
	github: process.env.NEXT_PUBLIC_GITHUB_URL || "",
	linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || "",
	youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || "",
	facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
	threads: process.env.NEXT_PUBLIC_THREADS_URL || "",
	mastodon: process.env.NEXT_PUBLIC_MASTODON_URL || "",
	author: "The Tiles Company",
	language: "en",
	theme: "light",
	locale: "en",
};

const getFooterLinks = (t: (k: string) => string) => {
	return [
		{ href: "/web", title: t("Footer.links.home"), prefetch: false },
		{ href: "/docs", title: t("Footer.links.docs"), prefetch: false },
		{ href: "/web/about", title: t("Footer.links.whoWeAre"), prefetch: false },
		{
			href: "/web/terms",
			title: t("Footer.links.termsAndConditions"),
			prefetch: false,
		},
		{
			href: "/web/privacy",
			title: t("Footer.links.privacyPolicy"),
			prefetch: false,
		},
		{ href: "/web/contact", title: t("Footer.links.contact"), prefetch: false },
	];
};

export { metadata, getFooterLinks };
