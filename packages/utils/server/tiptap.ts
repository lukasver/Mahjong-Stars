import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { StarterKit } from '@tiptap/starter-kit';

export * from '@tiptap/html';
export { type JSONContent, type HTMLContent } from '@tiptap/core';
export const extensions = [
  StarterKit.configure({
    bulletList: {
      HTMLAttributes: {
        style:
          'list-style-type: disc; list-style-position: outside; line-height: 1; margin-top: -0.5rem;',
      },
    },
    orderedList: {
      HTMLAttributes: {
        style:
          'list-style-type: decimal; list-style-position: outside; line-height: 1; margin-top: -0.5rem;',
      },
    },
    listItem: {
      HTMLAttributes: {
        style: 'line-height: normal; margin-bottom: -0.5rem;',
      },
    },
    blockquote: {
      HTMLAttributes: {
        style: 'border-left: 4px solid var(--primary);',
      },
    },
    codeBlock: {
      HTMLAttributes: {
        style:
          'border-radius: 0.375rem; background-color: var(--muted); color: var(--muted-foreground); border: 1px solid; padding: 1.25rem; font-family: monospace; font-weight: 500;',
      },
    },
    code: {
      HTMLAttributes: {
        style:
          'border-radius: 0.375rem; background-color: var(--muted); padding: 0.375rem 0.25rem; font-family: monospace; font-weight: 500;',
        spellcheck: 'false',
      },
    },
    horizontalRule: false,
    dropcursor: {
      color: '#DBEAFE',
      width: 4,
    },
    gapcursor: false,
  }),
  Link.configure({
    HTMLAttributes: {
      style:
        'color: var(--muted-foreground); text-decoration: underline; text-underline-offset: 3px; cursor: pointer;',
    },
  }),
  Image.configure({
    inline: true,
    allowBase64: true,
    HTMLAttributes: {
      style: 'border-radius: 0.5rem; border: 1px solid var(--muted);',
    },
  }),
  TaskList.configure({
    HTMLAttributes: {
      style: 'padding-left: 0.5rem;',
    },
  }),
  TaskItem.configure({
    HTMLAttributes: {
      style:
        'display: flex; gap: 0.5rem; align-items: flex-start; margin: 1rem 0;',
    },
    nested: true,
  }),
  Placeholder.configure({
    placeholder: 'Write something...',
  }),
  Highlight,
  HorizontalRule.configure({
    HTMLAttributes: {
      style:
        'margin-top: 1rem; margin-bottom: 1.5rem; border-top: 1px solid var(--muted-foreground);',
    },
  }),
  Underline.configure({
    HTMLAttributes: {
      style: 'text-decoration: underline;',
    },
  }),
  TextStyle.configure({
    HTMLAttributes: {
      style: '',
    },
  }),
  Color.configure({
    types: ['textStyle'],
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  // This breaks ... need to find a way to add
  // Markdown.configure({
  //   html: true, // Allow HTML input/output
  //   tightLists: false, // No <p> inside <li> in markdown output
  //   tightListClass: 'tight', // Add class to <ul> allowing you to remove <p> margins when tight
  //   bulletListMarker: '-', // <li> prefix in markdown output
  //   linkify: false, // Create links from "https://..." text
  //   breaks: false, // New lines (\n) in markdown input are converted to <br>
  //   transformPastedText: false, // Allow to paste markdown text in the editor
  //   transformCopiedText: false, // Copied text is transformed to markdown
  // }),
];
