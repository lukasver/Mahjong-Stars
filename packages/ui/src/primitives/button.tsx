'use client';

import { cn } from '@mjs/ui/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';
import { Icons } from '../components/icons';

const buttonVariants = cva(
  'cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary-300 text-primary-foreground hover:bg-primary-300/90 dark:bg-primary-700 dark:hover:bg-primary-700/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-white/10 bg-clip-padding backdrop-filter backdrop-blur-sm hover:bg-accent/10 hover:text-secondary-300 text-foreground hover:border-secondary-100',
        outlinePrimary:
          'border border-primary-300 dark:border-primary-900 hover:bg-primary-100/50 dark:hover:bg-primary-900',
        outlineSecondary:
          'border border-secondary-300 dark:border-secondary-900  hover:bg-secondary-100/50 dark:hover:bg-secondary-900',
        primary:
          'bg-primary text-primary-foreground hover:bg-secondary-300/90 dark:bg-primary-700 dark:hover:bg-secondary-700/90',
        secondary:
          'bg-secondary-300/70 text-secondary-foreground hover:bg-secondary-300/90 dark:bg-secondary-700 dark:hover:bg-secondary-700/90',
        accent:
          'bg-accent text-accent-foreground hover:bg-accent/30 dark:bg-primary-700 dark:hover:bg-primary-700/90',
        ghost:
          'text-foreground hover:bg-secondary-800 hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        xl: 'h-12 rounded-md px-6 sm:px-10 text-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          'grid [&>*]:col-span-full [&>*]:row-span-full'
        )}
        ref={ref}
        {...(!asChild && { type: 'button' })}
        {...props}
      >
        <Icons.loader
          className={cn(loading ? 'text-foreground animate-spin' : 'hidden')}
        />
        <span
          className={cn(
            'flex items-center gap-2',
            loading && 'sr-only hidden!'
          )}
        >
          {props.children}
        </span>
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
