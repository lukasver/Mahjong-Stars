import { deepmerge } from "deepmerge-ts";
import { Metadata } from "next";
import { siteConfig } from "@/data/config/site.settings";

const defaults = {
	title: siteConfig.title,
	description: siteConfig.description,
	openGraph: {
		title: `${siteConfig.title}`,
		description: siteConfig.description,
		url: "./",
		siteName: siteConfig.title,
		images: undefined,
		locale: "en_US",
		type: "website",
	},
	twitter: {
		title: `${siteConfig.title}`,
		card: "summary_large_image",
		images: undefined,
	},
};

export function genPageMetadata(overrides: Partial<Metadata>): Metadata {
	return deepmerge(defaults, overrides) as Metadata;
}
