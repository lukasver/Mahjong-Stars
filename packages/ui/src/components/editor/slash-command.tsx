"use client";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  CheckSquare,
  Code,
  FileSignature,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  List,
  ListOrdered,
  Text,
  TextQuote,
  WrapText
} from "lucide-react";
import {
  Command,
  createSuggestionItems,
  renderItems,
  SuggestionItem,
} from "novel/extensions";
import { uploadFn } from "./image-upload";


export const getSuggestionItems = (
  onUpload?: (file: File) => Promise<unknown>,
) =>
  createSuggestionItems(
    [
      // {
      //   title: 'Send Feedback',
      //   description: 'Let us know how we can improve.',
      //   icon: <MessageSquarePlus size={18} />,
      //   command: ({ editor, range }) => {
      //     editor.chain().focus().deleteRange(range).run()
      //     window.open('/feedback', '_blank')
      //   },
      // },
      {
        title: "Text",
        description: "Just start typing with plain text.",
        searchTerms: ["p", "paragraph"],
        icon: <Text size={18} />,
        // @ts-expect-error fixme?

        command: ({ editor, range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .toggleNode("paragraph", "paragraph")
            .run();
        },
      },
      {
        title: "To-do List",
        description: "Track tasks with a to-do list.",
        searchTerms: ["todo", "task", "list", "check", "checkbox"],
        icon: <CheckSquare size={18} />,
        // @ts-expect-error fixme?

        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
      },
      {
        title: "Heading 1",
        description: "Big section heading.",
        searchTerms: ["title", "big", "large"],
        icon: <Heading1 size={18} />,
        // @ts-expect-error fixme?

        command: ({ editor, range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode("heading", { level: 1 })
            .run();
        },
      },
      {
        title: "Heading 2",
        description: "Medium section heading.",
        searchTerms: ["subtitle", "medium"],
        icon: <Heading2 size={18} />,
        // @ts-expect-error fixme?

        command: ({ editor, range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode("heading", { level: 2 })
            .run();
        },
      },
      {
        title: "Heading 3",
        description: "Small section heading.",
        searchTerms: ["subtitle", "small"],
        icon: <Heading3 size={18} />,
        // @ts-expect-error fixme?
        command: ({ editor, range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode("heading", { level: 3 })
            .run();
        },
      },
      {
        title: "Bullet List",
        description: "Create a simple bullet list.",
        searchTerms: ["unordered", "point"],
        icon: <List size={18} />,
        // @ts-expect-error fixme?
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
      },
      {
        title: "Numbered List",
        description: "Create a list with numbering.",
        searchTerms: ["ordered"],
        icon: <ListOrdered size={18} />,
        // @ts-expect-error fixme?
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
      },
      {
        title: "Quote",
        description: "Capture a quote.",
        searchTerms: ["blockquote"],
        icon: <TextQuote size={18} />,
        // @ts-expect-error fixme?
        command: ({ editor, range }) =>
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .toggleNode("paragraph", "paragraph")
            .toggleBlockquote()
            .run(),
      },
      {
        title: "Code",
        description: "Capture a code snippet.",
        searchTerms: ["codeblock"],
        icon: <Code size={18} />,
        // @ts-expect-error fixme?
        command: ({ editor, range }) =>
          editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
      },
      {
        title: "Align Left",
        description: "Align text to the left.",
        searchTerms: ["left", "align"],
        icon: <AlignLeft size={18} />,
        // @ts-expect-error fixme?
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setTextAlign("left").run();
        },
      },
      {
        title: "Align Center",
        description: "Center align text.",
        searchTerms: ["center", "align", "middle"],
        icon: <AlignCenter size={18} />,
        // @ts-expect-error fixme?
        command: ({ editor, range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setTextAlign("center")
            .run();
        },
      },
      {
        title: "Align Right",
        description: "Align text to the right.",
        searchTerms: ["right", "align"],
        icon: <AlignRight size={18} />,
        // @ts-expect-error fixme?
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setTextAlign("right").run();
        },
      },
      {
        title: "Justify",
        description: "Justify text alignment.",
        searchTerms: ["justify", "align", "full"],
        icon: <AlignJustify size={18} />,
        // @ts-expect-error fixme?
        command: ({ editor, range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setTextAlign("justify")
            .run();
        },
      },
      {
        title: "Hard Break",
        description: "Insert a hard break.",
        searchTerms: ["hard", "break", "line"],
        icon: <WrapText size={18} />,
        // @ts-expect-error fixme?
        command: ({ editor, range }) => {
          editor.chain().deleteRange(range).run();
          editor.commands.setHardBreak();
        },
      },
      {
        title: "Signature Block",
        description: "Create a signature block with two columns.",
        searchTerms: ["signature", "block", "columns", "two-column"],
        icon: <FileSignature size={18} />,
        // @ts-expect-error fixme?
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertTable({
            rows: 3, cols: 2, withHeaderRow: false,
          });
        },
      },
      {
        title: "Page Break",
        description: "Insert a page break for PDF generation.",
        searchTerms: ["page", "break", "new", "page", "pdf"],
        icon: <FileText size={18} />,
        // @ts-expect-error fixme?
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setPageBreak().run();
        },
      },

      onUpload && {
        title: "Image",
        description: "Upload an image from your computer.",
        searchTerms: ["photo", "picture", "media"],
        icon: <ImageIcon size={18} />,
        // @ts-expect-error fixme?
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          // upload image
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = async () => {
            if (input.files?.length) {
              const file = input.files[0];
              const pos = editor.view.state.selection.from;
              if (file) {
                uploadFn(onUpload)(file, editor.view, pos);
              }
            }
          };
          input.click();
        },
      },
    ].filter(Boolean) as SuggestionItem[],
  );

export const getSlashCommands = (onUpload?: (file: File) => Promise<unknown>) =>
  Command.configure({
    suggestion: {
      items: () => getSuggestionItems(onUpload),
      render: renderItems,
    },
  });
