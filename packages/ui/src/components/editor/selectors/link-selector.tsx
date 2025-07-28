'use client';
import { cn } from '@mjs/ui/lib/utils';
import { Check, Trash } from 'lucide-react';
import { useEditor } from 'novel';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@mjs/ui/primitives/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@mjs/ui/primitives/popover';
import { toast } from 'sonner';

export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
export function getUrlFromString(str: string) {
  console.debug('🚀 ~ link-selector.tsx:24 ~ str:', str);

  if (isValidUrl(str)) return str;
  try {
    if (str.includes('.') && !str.includes(' ')) {
      return new URL(`https://${str}`).toString();
    }
  } catch {
    toast.error('Invalid URL');
    return null;
  }
}
interface LinkSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LinkSelector = ({ open, onOpenChange }: LinkSelectorProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(null);

  const { editor } = useEditor();

  // Autofocus on input by default
  useEffect(() => {
    inputRef.current && inputRef.current?.focus();
  });

  const handleConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const _url = getUrlFromString(url || '');
    if (_url && editor) {
      editor.chain().focus().setLink({ href: _url }).run();
      onOpenChange(false);
    }
  };

  if (!editor) return null;

  return (
    <Popover modal={true} open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size='sm'
          variant='ghost'
          className='gap-2 rounded-none border-none'
          type={'button'}
        >
          <p className='text-base'>↗</p>
          <p
            className={cn('underline decoration-stone-400 underline-offset-4', {
              'text-blue-500': editor.isActive('link'),
            })}
          >
            Link
          </p>
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-60 p-0' sideOffset={10}>
        <div className='flex p-1'>
          <input
            ref={inputRef}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={(e) => {
              const url = getUrlFromString(e.clipboardData.getData('text'));
              if (url) {
                setUrl(url);
              }
            }}
            type='text'
            placeholder='Paste a link'
            className='bg-background flex-1 p-1 text-sm outline-none'
            defaultValue={editor.getAttributes('link').href || ''}
          />
          {editor.getAttributes('link').href ? (
            <Button
              size='icon'
              variant='outline'
              type='button'
              className='flex h-8 items-center rounded-sm p-1 text-red-600 transition-all hover:bg-red-100 dark:hover:bg-red-800'
              onClick={() => {
                editor.chain().focus().unsetLink().run();
                onOpenChange(false);
              }}
            >
              <Trash className='h-4 w-4' />
            </Button>
          ) : (
            <Button
              size='icon'
              className='h-8'
              type='button'
              onClick={handleConfirm}
            >
              <Check className='h-4 w-4' />
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
