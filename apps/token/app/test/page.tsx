'use client';

import { useAppForm } from '@mjs/ui/primitives/form/index';
import { InputOptionsProvider } from '@/components/hooks/use-input-options';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { FormInput } from '@mjs/ui/primitives/form-input';
import { Button } from '@mjs/ui/primitives/button';
import { useCallback } from 'react';

export default function Page() {
  const form = useAppForm({
    // validators: { onSubmit: FormSchema },
    defaultValues: {
      test: true,
    },
    onSubmit: async ({ value }) => {
      console.debug('SOY ONSUBMIT', value);
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form]
  );
  return (
    <NuqsAdapter>
      <InputOptionsProvider>
        <form.AppForm>
          <form className='container mx-auto' onSubmit={handleSubmit}>
            <FormInput type='checkbox' name='test' label='Test' />
            <Button type='submit'>Submit</Button>
          </form>
        </form.AppForm>
      </InputOptionsProvider>
    </NuqsAdapter>
  );
}
