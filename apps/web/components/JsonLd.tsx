import { DEFAULT_LOCALES } from "@mjs/i18n";
import { getTranslations } from "next-intl/server";
import {
	Article,
	BreadcrumbList,
	FAQPage,
	MemberProgram,
	type Organization,
	SoftwareApplication,
	SubscribeAction,
	type Thing,
	VideoGame,
	type WithContext,
} from "schema-dts";
import { metadata } from "@/data/config/metadata";
import { siteConfig } from "@/data/config/site.settings";

type TFunction = Awaited<ReturnType<typeof getTranslations>>;

/**
 * @description https://developers.google.com/search/docs/appearance/structured-data
 */
export const JsonLd = <T extends Thing>({
	jsonLd,
}: {
	jsonLd: WithContext<T>;
}) => {
	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	);
};

export const createOrganizationJsonLd = (
	t: TFunction,
): WithContext<Organization> => {
	return {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: t("Metadata.title"),
		legalName: "WASABI GAMES DMCC",
		alternateName: "Mahjong Stars",
		url: siteConfig.siteUrl,
		email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
		description: t("Metadata.description"),
		foundingDate: "2025",
		logo: [
			{
				"@type": "ImageObject",
				url: "https://storage.googleapis.com/mjs-public/branding/isologo.webp",
				width: "512",
				height: "512",
			},
			{
				"@type": "ImageObject",
				width: "120",
				height: "120",
				url: "https://storage.googleapis.com/mjs-public/branding/icon-120x120.png",
			},
		],
		founder: {
			"@type": "Person",
			name: "Jonas Alm",
			email: siteConfig.supportEmail,
			url: "https://www.linkedin.com/in/jonas-a-40651",
		},
		sameAs: [
			siteConfig.twitter,
			siteConfig.instagram,
			siteConfig.tiktok,
		].filter(Boolean),
		contactPoint: {
			"@type": "ContactPoint",
			email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
			contactType: "customer service",
		},
		areaServed: "Worldwide",
		knowsAbout: [
			// "Web3 Gaming",
			"AI Technology",
			"Mahjong",
			"Blockchain",
			"NFTs",
			"Cryptocurrency",
		],
	};
};

export const createFaqJsonLd = (
	content: FAQPage["mainEntity"],
): WithContext<FAQPage> => {
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		name: "FAQ",
		mainEntity: content,
	};
};

export const createSoftwareAppJsonLd = (
	t: TFunction,
): WithContext<SoftwareApplication> => {
	return {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: t("Metadata.title"),
		applicationCategory: "GameApplication",
		operatingSystem: ["iOS", "Android", "Web"],
		description:
			t("Metadata.description"),
		url: siteConfig.siteUrl,
		screenshot: "https://docs.mahjongstars.com/static/images/banner.png",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
			availability: "https://schema.org/PreSale",
		},
		// aggregateRating: {
		// 	"@type": "AggregateRating",
		// 	ratingValue: "4.8",
		// 	ratingCount: "1000",
		// },
		author: {
			"@type": "Organization",
			name: siteConfig.author,
		},
		datePublished: "2025-12-31",
		inLanguage: DEFAULT_LOCALES,
		keywords:
			"mahjong, ai gaming, nft, blockchain, social gaming, multiplayer",
	};
};

export const createVideoGameJsonLd = (t: TFunction): WithContext<VideoGame> => {
	return {
		"@context": "https://schema.org",
		"@type": "VideoGame",
		name: t("Metadata.title"),
		description: t("Metadata.description"),
		genre: "Strategy Game",
		gamePlatform: ["Web Browser", "Mobile"],
		playMode: ["MultiPlayer", "SinglePlayer"],
		gameLocation: "Online",
		softwareVersion: "Coming Soon",
		datePublished: "2025-12-31",
		author: {
			"@type": "Organization",
			name: "WASABI GAMES DMCC",
		},
		publisher: {
			"@type": "Organization",
			name: "WASABI GAMES DMCC",
		},
		url: metadata.siteUrl,
		image: `${metadata.siteUrl}/api/og`,
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
			availability: "https://schema.org/PreOrder",
			description: t("Global.soon"),
		},
		audience: {
			"@type": "PeopleAudience",
			requiredMinAge: 13,
			suggestedMaxAge: 99,
			audienceType: "Gamers",
		},
		character: [
			{
				"@type": "Person",
				name: "Bubble Girl",
				description: "AI Character in Mahjong Stars",
			},
		],
		gameItem: {
			"@type": "Thing",
			name: "Mahjong Tiles",
			description: "Traditional Mahjong tiles used in gameplay",
		},
	};
};

export const createClaimRewardsJsonLd = (
	t: TFunction,
): WithContext<MemberProgram> => {
	return {
		"@context": "https://schema.org",
		"@type": "MemberProgram",
		name: "Mahjong Stars Rewards Program",
		description: t("Metadata.Claim.description"),
		url: `${metadata.siteUrl}/claim`,
		// hasTiers: [
		// 	{
		// 		"@type": "MemberProgramTier",
		// 		name: "Player Tier",
		// 		description: "Basic rewards for all players",
		// 		hasTierBenefit: [
		// 			"https://schema.org/TierBenefitLoyaltyPoints",
		// 			"https://schema.org/TierBenefitLoyaltyPrice"
		// 		],
		// 		membershipPointsEarned: {
		// 			"@type": "QuantitativeValue",
		// 			value: 100,
		// 			unitText: "TILE tokens"
		// 		}
		// 	}
		// ],
	};
};

export const createNewsletterSubscribeJsonLd = (
	t: TFunction,
): WithContext<SubscribeAction> => {
	return {
		"@context": "https://schema.org",
		"@type": "SubscribeAction",
		agent: {
			"@type": "Person",
			name: "Newsletter Subscriber",
		},
		object: {
			"@type": "Service",
			name: "Mahjong Stars Newsletter",
			description:
				"Weekly newsletter with game updates, AI tips, tournament announcements, and exclusive rewards",
			provider: {
				"@type": "Organization",
				name: "Mahjong Stars",
				url: metadata.siteUrl,
			},
			serviceType: "Newsletter Service",
			areaServed: "Worldwide",
		},
		target: {
			"@type": "EntryPoint",
			url: `${metadata.siteUrl}/#newsletter`,
			actionPlatform: "Web",
		},
		actionStatus: "https://schema.org/ActiveActionStatus",
		instrument: {
			"@type": "Thing",
			name: "Email Subscription Form",
		},
		result: {
			"@type": "Thing",
			name: "Newsletter Subscription",
			description:
				"Successfully subscribed to Mahjong Stars newsletter for game updates and rewards",
		},
	};
};

export const createArticleJsonLd = (t: TFunction): WithContext<Article> => {
	//TODO
	return {
		"@context": "https://schema.org",
		"@type": "Article",
		headline: "Welcome to Mahjong Stars",
		description:
			"The next evolution of social gaming - AI-powered mahjong platform with 24/7 gameplay",
		author: {
			"@type": "Organization",
			name: "Mahjong Stars",
		},
		publisher: {
			"@type": "Organization",
			name: "Mahjong Stars",
			logo: {
				"@type": "ImageObject",
				url: "https://docs.mahjongstars.com/static/favicons/android-chrome-512x512.png",
			},
		},
		datePublished: "2025-07-09",
		dateModified: "2025-07-09",
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": "https://docs.mahjongstars.com",
		},
		image: "https://docs.mahjongstars.com/static/images/banner.png",
		articleSection: "Gaming Documentation",
		keywords: "introduction, overview, ai-gaming, social-gaming",
	};
};

export const createBreadcrumbListJsonLd = (
	t: TFunction,
	_lang: string = "en",
): WithContext<BreadcrumbList> => {
	const prefix = _lang === "en" ? "" : `/${_lang}`;
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{
				"@type": "ListItem",
				position: 1,
				name: "Home",
				item: "https://www.mahjongstars.com" + prefix,
			},

			{
				"@type": "ListItem",
				position: 2,
				name: "About",
				item: "https://www.mahjongstars.com" + prefix + "/about",
			},
			{
				"@type": "ListItem",
				position: 3,
				name: "FAQ",
				item: "https://www.mahjongstars.com" + prefix + "/faq",
			},
			{
				"@type": "ListItem",
				position: 4,
				name: "Contact",
				item: "https://www.mahjongstars.com" + prefix + "/contact",
			},
			{
				"@type": "ListItem",
				position: 5,
				name: "Docs",
				item: "https://www.mahjongstars.com" + prefix + "/docs",
			},
			{
				"@type": "ListItem",
				position: 6,
				name: "Terms",
				item: "https://www.mahjongstars.com" + prefix + "/terms",
			},
			{
				"@type": "ListItem",
				position: 7,
				name: "Privacy",
				item: "https://www.mahjongstars.com" + prefix + "/privacy",
			},
			{
				"@type": "ListItem",
				position: 8,
				name: "Claim",
				item: "https://www.mahjongstars.com" + prefix + "/claim",
			},
		],
	};
};
