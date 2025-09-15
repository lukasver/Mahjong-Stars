"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState } from "react";
import { OnRampWidget } from "@/components/buy/onramp";
import AccountProvider from "@/components/thirdweb/account-provider";
import AutoConnect from "@/components/thirdweb/autoconnect";
import { useTransactionById } from "@/lib/services/api";

export default function Page() {
  const [selectedValue, setSelectedValue] = useState<string>("");

  // Example options with grouping
  const groupedOptions = [
    { id: "1", value: "apple", label: "Apple", meta: { category: "Fruits" } },
    { id: "2", value: "banana", label: "Banana", meta: { category: "Fruits" } },
    { id: "3", value: "orange", label: "Orange", meta: { category: "Fruits" } },
    {
      id: "4",
      value: "carrot",
      label: "Carrot",
      meta: { category: "Vegetables" },
    },
    {
      id: "5",
      value: "broccoli",
      label: "Broccoli",
      meta: { category: "Vegetables" },
    },
    {
      id: "6",
      value: "spinach",
      label: "Spinach",
      meta: { category: "Vegetables" },
    },
    { id: "7", value: "milk", label: "Milk", meta: { category: "Dairy" } },
    { id: "8", value: "cheese", label: "Cheese", meta: { category: "Dairy" } },
  ];

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
          <div className="max-w-4xl w-full flex flex-col gap-8 justify-center">

            <OnRampWidget
              transaction={tx?.transaction}
              onSuccessPayment={() => {
                //
              }}
            />
          </div>
        </div>
      </AccountProvider>
    </NuqsAdapter>
  );
}
