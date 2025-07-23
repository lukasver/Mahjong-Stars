'use client';

import {
  EditorRoot,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorContent,
  type JSONContent,
  EditorCommandList,
  EditorBubble,
  type EditorInstance,
} from 'novel';
import { ImageResizer, handleCommandNavigation } from 'novel/extensions';
import { handleImageDrop, handleImagePaste } from 'novel/plugins';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { Separator } from '../../primitives/separator';
import { uploadFn } from './image-upload';
import { ColorSelector } from './selectors/color-selector';
import { LinkSelector } from './selectors/link-selector';
import { NodeSelector } from './selectors/node-selector';

import { TextButtons } from './selectors/text-buttons';
import { getSlashCommands, getSuggestionItems } from './slash-command';
import { cn } from '@mjs/ui/lib/utils';
import { defaultExtensions } from './extensions';

const extensions = defaultExtensions;

type HTMLContent = string;
export interface EditorProps {
  initialValue?: JSONContent;
  onChange: (value: JSONContent | HTMLContent, editor: EditorInstance) => void;
  className?: string;
  output?: 'json' | 'html';
  setEditor?: Dispatch<SetStateAction<EditorInstance | null>>;
  // If SSR set to false
  immediatelyRender?: boolean;
  onUpload?: (file: File) => Promise<unknown>;
}
const Editor = ({
  initialValue,
  onChange,
  className,
  output = 'json',
  setEditor,
  immediatelyRender = true,
  onUpload,
}: EditorProps) => {
  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openLink, setOpenLink] = useState(false);

  return (
    <EditorRoot>
      <EditorContent
        immediatelyRender={false}
        className={cn(
          'h-[200px] overflow-y-auto rounded-xl border p-4',
          className
        )}
        {...(initialValue && { initialContent: initialValue })}
        extensions={[...extensions, getSlashCommands(onUpload)]}
        editorProps={{
          handleDOMEvents: {
            keydown: (_view, event) => handleCommandNavigation(event),
          },
          ...(onUpload && {
            handlePaste: (view, event) =>
              handleImagePaste(view, event, uploadFn(onUpload)),
            handleDrop: (view, event, _slice, moved) =>
              handleImageDrop(view, event, moved, uploadFn(onUpload)),
          }),
          attributes: {
            class: `prose !text-base dark:prose-invert prose-headings:font-title font-common focus:outline-none max-w-full`,
          },
        }}
        onUpdate={({ editor }) => {
          if (output === 'json') {
            onChange(editor.getJSON(), editor);
          } else {
            onChange(editor.getHTML(), editor);
          }
        }}
        {...(setEditor && {
          onCreate: ({ editor }) => {
            setEditor(editor);
          },
          onDestroy: () => {
            setEditor(null);
          },
        })}
        slotAfter={<ImageResizer />}
      >
        <EditorCommand className='border-muted bg-background z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border px-1 py-2 shadow-md transition-all'>
          <EditorCommandEmpty className='text-muted-foreground px-2'>
            No results
          </EditorCommandEmpty>
          <EditorCommandList>
            {getSuggestionItems(onUpload).map((item) => (
              <EditorCommandItem
                value={item.title}
                onCommand={(val) => item.command?.(val)}
                className={`hover:bg-primary/15 aria-selected:bg-primary/15 flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm`}
                key={item.title}
              >
                <div className='border-muted bg-background flex h-10 w-10 items-center justify-center rounded-md border'>
                  {item.icon}
                </div>
                <div>
                  <p className='font-medium'>{item.title}</p>
                  <p className='text-muted-foreground text-xs'>
                    {item.description}
                  </p>
                </div>
              </EditorCommandItem>
            ))}
          </EditorCommandList>
        </EditorCommand>

        <EditorBubble
          tippyOptions={{
            placement: 'top',
          }}
          className='border-muted bg-background flex w-fit max-w-[90vw] overflow-hidden rounded-md border shadow-xl'
        >
          <Separator orientation='vertical' />
          <NodeSelector open={openNode} onOpenChange={setOpenNode} />
          <Separator orientation='vertical' />

          <LinkSelector open={openLink} onOpenChange={setOpenLink} />
          <Separator orientation='vertical' />
          <TextButtons />
          <Separator orientation='vertical' />
          <ColorSelector open={openColor} onOpenChange={setOpenColor} />
        </EditorBubble>
      </EditorContent>
    </EditorRoot>
  );
};

export type { JSONContent, EditorInstance };
export default Editor;
