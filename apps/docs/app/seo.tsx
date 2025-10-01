import "server-only";
import { deepmerge } from "deepmerge-ts";
import { Metadata } from "next";
import { metadata as siteConfig } from "@/lib/site-config";

const defaults = {
	metadataBase: new URL(siteConfig.siteUrl),
	title: {
		default: siteConfig.title,
		template: `%s | ${siteConfig.title}`,
	},
	description: siteConfig.description,
};

export function genPageMetadata(overrides: Partial<Metadata>): Metadata {
	const metadata = deepmerge(defaults, overrides) as Metadata;
	return metadata;
}
