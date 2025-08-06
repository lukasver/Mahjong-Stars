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
            <FormInput
              type='select'
              name='test'
              label='Test'
              inputProps={{
                options: [
                  {
                    id: 'cmdzywql7000f8o6px7ftqpkz',
                    value: 97,
                    label: 'BNB Smart Chain Testnet',
                  },
                  {
                    id: 'cmdzywql7000g8o6p2803uo3p',
                    value: 11155111,
                    label: 'Sepolia',
                  },
                  {
                    id: 'cmdzywql7000h8o6prb5pp38j',
                    value: 84532,
                    label: 'Base Sepolia',
                  },
                  {
                    id: 'cmdzywql7000i8o6pb5te11sa',
                    value: 8453,
                    label: 'Base',
                  },
                  {
                    id: 'cmdzywql7000j8o6p5z8d2kww',
                    value: 56,
                    label: 'BNB Smart Chain Mainnet',
                  },
                ],
              }}
            />
            <Button type='submit'>Submit</Button>
          </form>
        </form.AppForm>
      </InputOptionsProvider>
    </NuqsAdapter>
  );
}
