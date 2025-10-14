import { cn } from "@mjs/ui/lib/utils";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from "lucide-react";
import { EditorBubbleItem, useEditor } from "novel";
import { Button } from "../../../primitives/button";
import { type SelectorItem } from "./node-selector";

export const TextAlignButtons = () => {
  const { editor } = useEditor();
  if (!editor) return null;

  const items: SelectorItem[] = [
    {
      name: "align-left",
      isActive: (editor) => editor.isActive({ textAlign: "left" }),
      command: (editor) => editor.chain().focus().setTextAlign("left").run(),
      icon: AlignLeft,
    },
    {
      name: "align-center",
      isActive: (editor) => editor.isActive({ textAlign: "center" }),
      command: (editor) => editor.chain().focus().setTextAlign("center").run(),
      icon: AlignCenter,
    },
    {
      name: "align-right",
      isActive: (editor) => editor.isActive({ textAlign: "right" }),
      command: (editor) => editor.chain().focus().setTextAlign("right").run(),
      icon: AlignRight,
    },
    {
      name: "align-justify",
      isActive: (editor) => editor.isActive({ textAlign: "justify" }),
      command: (editor) => editor.chain().focus().setTextAlign("justify").run(),
      icon: AlignJustify,
    },
  ];

  return (
    <div className="flex">
      {items.map((item, index) => (
        <EditorBubbleItem
          key={index}
          onSelect={(editor) => {
            item.command(editor);
          }}
        >
          <Button
            size="sm"
            className="rounded-none"
            variant="ghost"
            type={"button"}
          >
            <item.icon
              className={cn("h-4 w-4", {
                "text-blue-500": item.isActive(editor),
              })}
            />
          </Button>
        </EditorBubbleItem>
      ))}
    </div>
  );
};
