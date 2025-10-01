import { deepmerge } from "deepmerge-ts";
import { Metadata } from "next";
import { siteConfig } from "@/data/config/site.settings";

const defaults = {
	metadataBase: new URL(siteConfig.siteUrl),
	title: siteConfig.title,
	description: siteConfig.description,
};

export function genPageMetadata(overrides: Partial<Metadata>): Metadata {
	const metadata = deepmerge(defaults, overrides) as Metadata;
	return metadata;
}
