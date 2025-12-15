"use client";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import AccountProvider from "@/components/thirdweb/account-provider";
import AutoConnect from "@/components/thirdweb/autoconnect";
import { TestClientComponent } from "./component";

export default async function Page() {
  return (
    <NuqsAdapter>
      <AutoConnect />
      <AccountProvider>
        <TestClientComponent />
      </AccountProvider>
    </NuqsAdapter>
  );
}
