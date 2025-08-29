"use client";

import { useAppForm } from "@mjs/ui/primitives/form/index";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useCallback } from "react";
import { NATIVE_TOKEN_ADDRESS } from "thirdweb";
import { bsc } from "thirdweb/chains";
import { BuyWidget } from "thirdweb/react";
import { InputOptionsProvider } from "@/components/hooks/use-input-options";
import { client } from "@/lib/auth/thirdweb-client";

export default function Page() {
  const form = useAppForm({
    // validators: { onSubmit: FormSchema },
    defaultValues: {
      test: true,
    },
    onSubmit: async ({ value }) => {
      console.debug("SOY ONSUBMIT", value);
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form],
  );
  return (
    <NuqsAdapter>
      <InputOptionsProvider>
        <div className='h-screen w-screen grid place-items-center'>
          <BuyWidget
            client={client}
            title="Get Funds"
            tokenAddress={NATIVE_TOKEN_ADDRESS}
            chain={bsc}
            amount={"59"}
          />
        </div>
        {/* <form.AppForm>
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
        </form.AppForm> */}
      </InputOptionsProvider>
    </NuqsAdapter>
  );
}
