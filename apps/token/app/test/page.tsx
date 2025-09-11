"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";

import { OnRampWidget } from "@/components/buy/onramp";
import AccountProvider from "@/components/thirdweb/account-provider";
import AutoConnect from "@/components/thirdweb/autoconnect";
import { useTransactionById } from "@/lib/services/api";

export default function Page() {
  // const form = useAppForm({
  //   // validators: { onSubmit: FormSchema },
  //   defaultValues: {
  //     test: true,
  //   },
  //   onSubmit: async ({ value }) => {
  //     console.debug("SOY ONSUBMIT", value);
  //   },
  // });

  // const handleSubmit = useCallback(
  //   (e: React.FormEvent) => {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     form.handleSubmit();
  //   },
  //   [form],
  // );

  const { data: tx, isLoading } = useTransactionById(
    "cmfe9bsvz00038o80h9injmnc" as string,
  );




  if (isLoading) {
    return <div>Loading testpage...</div>;
  }

  if (!tx?.transaction) {
    return <div>Transaction not found</div>;
  }

  return (
    <NuqsAdapter>
      <AutoConnect />
      <AccountProvider>
        <div className="h-screen w-screen grid place-items-center">
          <div className="max-w-4xl w-full flex justify-center">
            <OnRampWidget transaction={tx?.transaction} />
          </div>
        </div>
      </AccountProvider>
    </NuqsAdapter>
  );
}
