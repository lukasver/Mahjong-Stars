import { Pre, withIcons } from "nextra/components";
import { GitHubIcon } from "nextra/icons";
import type { MDXComponents } from "nextra/mdx-components";
import { useMDXComponents as getDocsMDXComponents } from "nextra-theme-docs";

const docsComponents = getDocsMDXComponents({
	pre: withIcons(Pre, { js: GitHubIcon }),
});

export const useMDXComponents: (components?: MDXComponents) => MDXComponents = (
	components,
) => ({
	...docsComponents,
	...components,
});
