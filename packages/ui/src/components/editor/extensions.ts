/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import HardBreak from "@tiptap/extension-hard-break";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { cx } from "class-variance-authority";
import {
	AIHighlight,
	Color,
	HorizontalRule,
	Placeholder,
	StarterKit,
	TaskItem,
	TaskList,
	TextStyle,
	TiptapImage,
	TiptapLink,
	TiptapUnderline,
	UpdatedImage,
} from "novel/extensions";

import { UploadImagesPlugin } from "novel/plugins";
import { PageBreak } from "./extensions/page-break";

const aiHighlight = AIHighlight;
const placeholder = Placeholder;
const tiptapLink = TiptapLink.configure({
	HTMLAttributes: {
		class: cx(
			"text-muted-foreground underline underline-offset-[3px] hover:text-primary transition-colors cursor-pointer",
		),
	},
	isAllowedUri(url, _ctx) {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	},
});

const tiptapImage = TiptapImage.extend({
	addProseMirrorPlugins() {
		return [
			UploadImagesPlugin({
				imageClass: cx("opacity-40 rounded-lg border border-stone-200"),
			}),
		];
	},
}).configure({
	allowBase64: true,
	HTMLAttributes: {
		class: cx("rounded-lg border border-muted"),
	},
});

const updatedImage = UpdatedImage.configure({
	HTMLAttributes: {
		class: cx("rounded-lg border border-muted"),
	},
});

const taskList = TaskList.configure({
	HTMLAttributes: {
		class: cx("not-prose pl-2 "),
	},
});
const taskItem = TaskItem.configure({
	HTMLAttributes: {
		class: cx("flex gap-2 items-start my-4"),
	},
	nested: true,
});

const horizontalRule = HorizontalRule.configure({
	HTMLAttributes: {
		class: cx("mt-4 mb-6 border-t border-muted-foreground"),
	},
});

const underline = TiptapUnderline.configure({
	HTMLAttributes: {
		class: cx("underline"),
	},
});
const starterKit = StarterKit.configure({
	bulletList: {
		HTMLAttributes: {
			class: cx("list-disc list-outside leading-3 -mt-2"),
		},
	},
	orderedList: {
		HTMLAttributes: {
			class: cx("list-decimal list-outside leading-3 -mt-2"),
		},
	},
	listItem: {
		HTMLAttributes: {
			class: cx("leading-normal -mb-2"),
		},
	},
	blockquote: {
		HTMLAttributes: {
			class: cx("border-l-4 border-primary"),
		},
	},
	codeBlock: {
		HTMLAttributes: {
			class: cx(
				"rounded-md bg-muted text-muted-foreground border p-5 font-mono font-medium",
			),
		},
	},
	code: {
		HTMLAttributes: {
			class: cx("rounded-md bg-muted  px-1.5 py-1 font-mono font-medium"),
			spellcheck: "false",
		},
	},

	horizontalRule: false,
	dropcursor: {
		color: "#DBEAFE",
		width: 4,
	},
	gapcursor: false,
});

const textStyle = TextStyle.configure({
	HTMLAttributes: {
		class: cx(""),
	},
});

const color = Color.configure({
	types: ["textStyle"],
});

const textAlign = TextAlign.configure({
	types: ["heading", "paragraph"],
});

const hardBreak = HardBreak.configure();

const tableKit = TableKit.configure({
	table: { resizable: true },
});

const pageBreak = PageBreak.configure({
	HTMLAttributes: {
		class: "page-break",
	},
});

export const defaultExtensions: unknown[] = [
	starterKit,
	textAlign,
	hardBreak,
	// Pages.configure({
	//   pageFormat: PAGE_FORMATS.A4,
	//   onPageFormatChange: setActivePageFormat,
	//   header: threeColumnHeaderFooter({
	//     left: 'Page header',
	//     center: '',
	//     right: '',
	//   }),
	//   footer: threeColumnHeaderFooter({
	//     left: 'Page footer',
	//     center: '',
	//     right: '{page} of {total}',
	//   }),
	//   pageBreakBackground: '#f7f7f7',
	// }),
	hardBreak,
	placeholder,
	tiptapLink,
	tiptapImage,
	updatedImage,
	underline,
	taskList,
	taskItem,
	horizontalRule,
	aiHighlight,
	color,
	textStyle,
	tableKit,
	pageBreak,
];
