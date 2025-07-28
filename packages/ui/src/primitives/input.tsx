import * as React from 'react';

import { cn } from '@mjs/ui/lib/utils';

export const getInputClass = () => {
  return cn(
    'flex h-10 w-full rounded-md',
    'border-none bg-secondary-700/50 backdrop-blur-xs',
    'px-3 py-2',
    'text-base md:text-sm text-foreground',
    `shadow shadow-[inset_0px_4px_4px_0px_rgba(0,0,0,0.25)]`,
    'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-800 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50'
  );
};

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, onWheel, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(getInputClass(), className)}
        ref={ref}
        onWheel={(e) => {
          // e.preventDefault();
          // Fix to involuntary number change when scrolling
          if (type === 'number') {
            (document?.activeElement as HTMLElement)?.blur();
          }
          onWheel?.(e);
        }}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
