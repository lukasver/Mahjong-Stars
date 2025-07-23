import * as React from 'react';

import { cn } from '@mjs/ui/lib/utils';

export const getInputClass = () => {
  return 'flex h-10 w-full rounded-md border border-none bg-secondary-700/50 backdrop-blur-xs px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium text-foreground file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-800 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-[var(--input-shadow)]';
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
