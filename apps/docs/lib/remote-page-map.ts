import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getRemoteFilePaths } from "@/lib/utils";
import {
	convertToPageMap,
	mergeMetaWithPageMap,
	normalizePageMap,
} from "nextra/page-map";

import dotenv from "dotenv";

dotenv.config();

const getRemotePageMap = async () => {
	if (process.env.ENABLE_REMOTE !== "true") {
		return {
			pages: {},
			pageMap: {},
		};
	}

	// Get only english filepath
	const files = await getRemoteFilePaths(
		"thetilescompany/docs/contents/test/en?ref=main",
	);

	const filePaths = files
		.filter((item: any) => item.type === "file")
		.map((item: any) => item.name);

	const { mdxPages, pageMap } = convertToPageMap({
		filePaths,
		basePath: "r",
	});
	// `mergeMetaWithPageMap` is used to change sidebar order and title
	const remotePageMap = mergeMetaWithPageMap(pageMap[0]!, {
		simple: {
			title: "Simple",
			type: "doc",
			theme: {
				typesetting: "article",
			},
		},
	});

	return {
		pages: mdxPages,
		pageMap: normalizePageMap(remotePageMap),
	};
};

const generateRemotePageMap = async () => {
	const { pages, pageMap } = await getRemotePageMap();

	const data = {
		pages,
		pageMap,
	};

	const dataDir = join(process.cwd(), "data");
	if (!existsSync(dataDir)) {
		mkdirSync(dataDir, { recursive: true });
	}

	const filePath = join(dataDir, "remote-page-map.json");
	writeFileSync(filePath, JSON.stringify(data, null, 2));

	// eslint-disable-next-line no-console
	console.log(`✅ Remote page map file generated at ${filePath}`);
};

const generateRemoteLocales = async () => {
	const files = await getRemoteFilePaths(
		"thetilescompany/docs/contents/test?ref=main",
	);

	const fileNames = files
		.filter((item: any) => item.type === "dir")
		.map((item: any) => item.name);

	const dataDir = join(process.cwd(), "data");
	if (!existsSync(dataDir)) {
		mkdirSync(dataDir, { recursive: true });
	}

	const filePath = join(dataDir, "locales.json");
	writeFileSync(
		filePath,
		process.env.ENABLE_REMOTE !== "true"
			? JSON.stringify(["en"], null, 2)
			: JSON.stringify(fileNames, null, 2),
	);
	// eslint-disable-next-line no-console
	console.log(`✅ Remote locales file generated at ${filePath}`);
};

await Promise.all([
	generateRemotePageMap().catch((err) => {
		// eslint-disable-next-line no-console
		console.error("❌ Error generating remote page map:", err);
		process.exit(1);
	}),
	generateRemoteLocales().catch((err) => {
		// eslint-disable-next-line no-console
		console.error("❌ Error generating remote locales:", err);
		process.exit(1);
	}),
]);
