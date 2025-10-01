import { getTranslations } from "next-intl/server";
import {
	FAQPage,
	MemberProgram,
	type Organization,
	SubscribeAction,
	type Thing,
	VideoGame,
	type WithContext,
} from "schema-dts";
import { metadata } from "@/data/config/metadata";
import { siteConfig } from '@/data/config/site.settings';

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

export const createOrganizationJsonLd = (t: TFunction): WithContext<Organization> => {
	return {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: t("Metadata.title"),
		legalName: "WASABI GAMES DMCC",
		url: siteConfig.siteUrl,
		email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
		description: t("Metadata.description"),
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
		character: [{
			"@type": "Person",
			name: "Bubble Girl",
			description: "AI Character in Mahjong Stars",
		}],
		gameItem: {
			"@type": "Thing",
			name: "Mahjong Tiles",
			description: "Traditional Mahjong tiles used in gameplay",
		},
	};
};

export const createClaimRewardsJsonLd = (t: TFunction): WithContext<MemberProgram> => {
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

export const createNewsletterSubscribeJsonLd = (t: TFunction): WithContext<SubscribeAction> => {
	return {
		"@context": "https://schema.org",
		"@type": "SubscribeAction",
		agent: {
			"@type": "Person",
			name: "Newsletter Subscriber",
		},
		object: {
			"@type": "Product",
			name: "Newsletter",
			description: t("Metadata.description"),
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
			description: "Successfully subscribed to Mahjong Stars newsletter for game updates and rewards",
		},
	};
};
