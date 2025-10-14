import { mergeAttributes, Node } from "@tiptap/core";
import { cx } from "class-variance-authority";

/**
 * PageBreak Extension for Tiptap Editor
 *
 * This extension creates a page break element that will be rendered with the class "page-break"
 * in the editor. When the content is converted to HTML for PDF generation, this class will
 * be used by the CSS to force page breaks using the `page-break-before: always` property.
 *
 * The page break appears as a visual separator in the editor with a dashed border and "Page Break" text.
 * In the generated PDF, the visual elements are hidden but the page break functionality is preserved.
 */

export interface PageBreakOptions {
	HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		pageBreak: {
			/**
			 * Insert a page break
			 */
			setPageBreak: () => ReturnType;
		};
	}
}

export const PageBreak = Node.create<PageBreakOptions>({
	name: "pageBreak",

	addOptions() {
		return {
			HTMLAttributes: {},
		};
	},

	group: "block",

	atom: true,

	addAttributes() {
		return {
			class: {
				default: "page-break",
				parseHTML: (element) => element.getAttribute("class"),
				renderHTML: (attributes) => {
					if (!attributes.class) {
						return {};
					}
					return {
						class: attributes.class,
					};
				},
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: 'div[class*="page-break"]',
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return [
			"div",
			mergeAttributes(
				{
					class: cx(
						"page-break my-4 border-t-2 border-dashed border-muted-foreground/50 text-center text-muted-foreground text-sm py-2",
					),
				},
				this.options.HTMLAttributes,
				HTMLAttributes,
			),
			["span", { class: "select-none print:hidden" }, "Page Break"],
		];
	},

	addCommands() {
		return {
			setPageBreak:
				() =>
				({ commands }) => {
					return commands.insertContent({
						type: this.name,
					});
				},
		};
	},
});
