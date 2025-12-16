import { DEFAULT_LOCALES } from "@mjs/i18n";
import { PageMapItem } from "nextra";
import {
	Article,
	BreadcrumbList,
	FAQPage,
	type Organization,
	Question,
	SoftwareApplication,
	SubscribeAction,
	type Thing,
	VideoGame,
	type WithContext,
} from "schema-dts";
import { Locale } from "@/lib/i18n";
import { getDictionary, getTranslations } from "@/lib/i18n/get-dictionaries";
import { metadata, metadata as siteConfig } from "@/lib/site-config";

type TFunction = Awaited<ReturnType<typeof getTranslations>>;

type PageMetadata = {
	title: string;
	description: string;
	sidebarTitle: string;
	sectionTitle: string;
	tags: string[];
	date: string;
	filePath: string;
	image?: string;
	timestamp: number;
};

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
		alternateName: "The Tiles Company",
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
			"Web3 Gaming",
			"AI Technology",
			"Mahjong",
			"Blockchain",
			"NFTs",
			"Cryptocurrency",
		],
	};
};

export const createFaqJsonLd = async (
	lang: Locale = "en",
	content: string,
	meta: PageMetadata,
): Promise<WithContext<FAQPage>> => {
	const url =
		meta?.filePath?.split("/")?.slice(1)?.join("/")?.split(".mdx")[0] ||
		siteConfig.siteUrl;

	const faq: WithContext<Question>[] = [];

	const d = await getDictionary(lang)
	d.FAQ.sections.forEach((item) => {
		item.questions.forEach((question) => {
			faq.push({
				"@context": "https://schema.org",
				"@type": "Question",
				name: question.question,
				acceptedAnswer: {
					"@type": "Answer",
					text: question.answer,
				},
			})
		})
	})

	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		name: "FAQ",
		url,
		mainEntity: faq
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
		description: t("Metadata.description"),
		url: siteConfig.siteUrl,
		screenshot: "https://docs.thetilescompany.io/static/images/banner.webp",
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
		url: siteConfig.siteUrl,
		image: `${siteConfig.siteUrl}/api/og`,
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
				description: "AI Character in MJS",
			},
		],
		gameItem: {
			"@type": "Thing",
			name: "Mahjong Tiles",
			description: "Traditional Mahjong tiles used in gameplay",
		},
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
			name: "The Tiles Company Newsletter",
			description:
				"Weekly newsletter with game updates, AI tips, tournament announcements, and exclusive rewards",
			provider: {
				"@type": "Organization",
				name: "The Tiles Company",
				url: "https://www.thetilescompany.io",
			},
			serviceType: "Newsletter Service",
			areaServed: "Worldwide",
		},
		target: {
			"@type": "EntryPoint",
			url: `https://www.thetilescompany.io`,
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
				"Successfully subscribed to The Tiles Company newsletter for game updates and rewards",
		},
	};
};

export const createArticleJsonLd = (
	pageMetadata: PageMetadata,
): WithContext<Article> => {
	const tags = pageMetadata?.tags?.join(", ") || "";

	const isElegible = (pathname?: string): boolean => {
		return !!pathname && !pathname.includes("_") && !pathname.includes("index");
	};

	const getUrlWithPathname = (filePath: string) => {
		const pathname = filePath?.split("/").slice(1).join("/") || "";
		if (!pathname || !isElegible(pathname)) {
			return siteConfig.siteUrl;
		}
		return `${siteConfig.siteUrl}/${pathname}`.split(".mdx")[0];
	};
	const url = getUrlWithPathname(pageMetadata.filePath);

	return {
		"@context": "https://schema.org",
		"@type": "Article",
		headline: pageMetadata.title,
		description: pageMetadata.description,
		author: {
			"@type": "Organization",
			name: metadata.author,
		},
		publisher: {
			"@type": "Organization",
			name: "The Tiles Company",
			logo: [
				{
					"@type": "ImageObject",
					url: "https://storage.googleapis.com/mjs-public/branding/isologo.webp",
					height: "512",
					width: "512",
				},
				{
					"@type": "ImageObject",
					width: "120",
					height: "120",
					url: "https://storage.googleapis.com/mjs-public/branding/icon-120x120.png",
				},
			],
		},
		datePublished: pageMetadata.date,
		dateModified: pageMetadata.date,
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": url,
		},
		image:
			pageMetadata.image ||
			"https://docs.thetilescompany.io/static/images/banner.webp",
		articleSection: "Gaming Documentation",
		keywords:
			"mahjong, ai gaming, nft, blockchain, social gaming, multiplayer" +
				tags
				? `, ${tags}`
				: "",
	};
};

/**
 * Creates a breadcrumb list for the docs homepage
 */
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
				item: siteConfig.siteUrl + prefix,
			},
		],
	};
};

/**
 * Creates a breadcrumb list for the docs homepage using PageMapItem[]
 * This is a fallback for when we don't have the current route
 */
export const createBreadcrumbListFromPageMap = (
	lang: string = "en",
	pageMap: PageMapItem[],
): WithContext<BreadcrumbList> => {
	const prefix = lang === "en" ? "" : `/${lang}`;

	const breadcrumbs = [
		{
			"@type": "ListItem" as const,
			position: 1,
			name: "Documentation",
			item: siteConfig.siteUrl + prefix,
		},
	];

	function processBreadcrumbs(pMap: PageMapItem[]) {
		pMap.forEach((p) => {
			if (p && "data" in p) {
				return;
			}
			// is folder
			if (p && "children" in p) {
				processBreadcrumbs(p.children);
				return;
			}
			// is page
			if (p && "route" in p) {
				if (p.name.startsWith("_")) {
					return;
				}
				breadcrumbs.push({
					"@type": "ListItem" as const,
					position: breadcrumbs.length + 1,
					name: p.frontMatter?.title || p.name,
					item: siteConfig.siteUrl + prefix + p.route,
				});
				return;
			}
		});
	}

	processBreadcrumbs(pageMap);

	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: breadcrumbs,
	};
};
