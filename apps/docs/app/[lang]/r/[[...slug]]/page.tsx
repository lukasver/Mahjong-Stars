import remotePageMap from "@/data/remote-page-map.json";
import { useMDXComponents as getMDXComponents } from "@/mdx-components";
import { notFound } from "next/navigation";
import { compileMdx } from "nextra/compile";
import { Callout, Tabs } from "nextra/components";
import { evaluate } from "nextra/evaluate";

//raw.githubusercontent.com/thetilescompany/docs/refs/heads/main/test/index.mdx
const user = process.env.GITHUB_USER || "thetilescompany";
const repo = process.env.GITHUB_REPO || "docs";
const branch = process.env.GITHUB_BRANCH || "refs/heads/main";
const docsPath = process.env.GITHUB_DOCS_PATH || "test/";

const { wrapper: Wrapper, ...components } = getMDXComponents({
	$Tabs: Tabs,
	Callout,
});

type PageProps = Readonly<{
	params: Promise<{
		slug?: string[];
		lang: string;
	}>;
}>;

export default async function Page(props: PageProps) {
	const params = await props.params;
	const route = params.slug?.join("/") ?? "";
	const lang = params.lang;

	// @ts-expect-error wontfix
	const filePath = remotePageMap.pages[route];

	if (!filePath) {
		notFound();
	}
	const response = await fetch(
		`https://raw.githubusercontent.com/${user}/${repo}/${branch}/${docsPath}/${lang}/${filePath}`,
	);
	const data = await response.text();

	const rawJs = await compileMdx(data, { filePath });
	const { default: MDXContent, toc, metadata } = evaluate(rawJs, components);

	return (
		// @ts-expect-error wontfix
		<Wrapper toc={toc} metadata={metadata}>
			<MDXContent />
		</Wrapper>
	);
}

export async function generateStaticParams() {
	const params = Object.keys(remotePageMap.pages).map((route) => ({
		slug: route.split("/"),
	}));

	return params;
}
