'use client';

import { Slot } from '@radix-ui/react-slot';
import { useFormContext } from './tanstack-form';
import { Button } from '../button';

export function SubmitButton({
  children,
  asChild = false,
  className,
}: {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}) {
  const form = useFormContext();
  const Comp = asChild ? Slot : Button;
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Comp
          type='submit'
          variant='accent'
          disabled={isSubmitting}
          loading={isSubmitting}
          className={className}
        >
          {children}
        </Comp>
      )}
    </form.Subscribe>
  );
}
