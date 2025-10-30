"use client";

import { Icons } from "@mjs/ui/components/icons";
import React from "react";
import { AccountProvider as AccountProviderThirdweb } from "thirdweb/react";
import { client } from "@/lib/auth/thirdweb-client";
import useActiveAccount from "../hooks/use-active-account";
import { PointerEventsGuard } from "./pointer-events-guard";

const IS_DEV = process.env.NODE_ENV === "development";
// change to true for debug
const DEBUG = IS_DEV && false;

function AccountProvider({ children }: { children: React.ReactNode }) {
  const { activeAccount, status } = useActiveAccount();



  // In development we don't care if wallet is connected
  if (DEBUG) {
    return (
      <AccountProviderThirdweb address={""} client={client}>
        {children}
      </AccountProviderThirdweb>
    );
  }

  if (activeAccount) {
    return (
      <PointerEventsGuard>
        <AccountProviderThirdweb
          address={activeAccount.address}
          client={client}
        >
          {children}
        </AccountProviderThirdweb>
      </PointerEventsGuard>
    );
  }

  if (status === "connected") {
    return (
      <div className="h-screen w-screen grid place-items-center">
        <Icons.loader className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

export default AccountProvider;
