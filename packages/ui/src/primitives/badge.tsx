import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@mjs/ui/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary-300 text-primary-foreground hover:bg-primary-300/80 dark:bg-primary-700 dark:hover:bg-primary-700/80',
        secondary:
          'border-transparent bg-secondary-300 text-secondary-foreground hover:bg-secondary-300/80 dark:bg-secondary-700 dark:hover:bg-secondary-700/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        accent:
          'border-transparent bg-accent text-accent-foreground hover:bg-accent/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
