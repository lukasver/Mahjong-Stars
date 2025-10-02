import { generateStaticParamsFor, importPage } from "nextra/pages";
import "@/app/styles.css";

import { ScrollProgress } from "@mjs/ui/components/scroll-progress";
import { createArticleJsonLd, createFaqJsonLd, JsonLd } from "@/components/JsonLd";
import { useMDXComponents as getMDXComponents } from "@/mdx-components";
export const generateStaticParams = generateStaticParamsFor("mdxPath");

const importMdx = async (params: { mdxPath: string[]; lang: string }) => {
	let result = {};
	try {
		result = await importPage(params.mdxPath, params.lang);
	} catch (e) {
		console.debug(
			`[ERROR]: ${params.lang} ${params.mdxPath}: ${e instanceof Error ? e.message : e
			}`,
		);
		return null;
	}
	return result;
};

export async function generateMetadata(props: PageProps) {
	const params = await props.params;

	if (params.lang?.length > 2) {
		return null;
	}

	// @ts-expect-error fixme
	const { metadata } = await importMdx(params);

	return metadata;
}

type PageProps = Readonly<{
	params: Promise<{
		mdxPath: string[];
		lang: string;
	}>;
}>;

const Wrapper = getMDXComponents().wrapper!;

export default async function Page(props: PageProps) {
	const params = await props.params;

	if (params.lang.length > 2) {
		return null;
	}

	const result = await importMdx({
		mdxPath: params.mdxPath,
		lang: params.lang,
	});

	if (!result) {
		return null;
	}
	// @ts-expect-error fixme
	const { default: MDXContent, toc, metadata } = result;


	return (
		<Wrapper toc={toc} metadata={metadata}>
			<MDXContent {...props} params={params} />
			<ScrollProgress className="mt-[63px]" />
			<JsonLd jsonLd={createArticleJsonLd(metadata)} />
			{metadata?.filePath?.includes('faq') && <JsonLd jsonLd={await createFaqJsonLd(params.lang, MDXContent, metadata)} />}
		</Wrapper>
	);
}

export const dynamicParams = false;
export const dynamic = "force-static";
