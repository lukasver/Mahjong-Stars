"use client";

import { Icons } from "@mjs/ui/components/icons";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@mjs/ui/primitives/alert-dialog";
import { Button } from "@mjs/ui/primitives/button";
import React from "react";
import { AccountProvider as AccountProviderThirdweb } from "thirdweb/react";
import { client } from "@/lib/auth/thirdweb-client";
import { ConnectWalletWithChains } from "../connect-wallet";
import useActiveAccount from "../hooks/use-active-account";
import { PointerEventsGuard } from './pointer-events-guard';

const IS_DEV = process.env.NODE_ENV === "development";
// change to true for debug
const DEBUG = IS_DEV && false;

function AccountProvider({ children }: { children: React.ReactNode }) {
  const { activeAccount, status, signout, isLoading } = useActiveAccount();

  const handleClose = async () => {
    await signout();
  };

  // In development we don't care if wallet is connected
  if (DEBUG) {
    return (
      <AccountProviderThirdweb address={""} client={client}>
        {children}
      </AccountProviderThirdweb>
    );
  }

  if (status === "disconnected") {
    return (
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center justify-between gap-2">
              <AlertDialogTitle className="flex-1">
                Please connect your wallet
              </AlertDialogTitle>
              <Button
                variant="ghost"
                size="icon"
                tabIndex={-1}
                onClick={() => {
                  handleClose();
                }}
                loading={isLoading}
              >
                <Icons.x className="w-4 h-4" />
              </Button>
            </div>
          </AlertDialogHeader>
          <ConnectWalletWithChains />
        </AlertDialogContent>
      </AlertDialog>
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
