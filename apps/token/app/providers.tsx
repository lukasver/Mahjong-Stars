"use client";
import { SidebarProvider } from "@mjs/ui/primitives/sidebar";
import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type React from "react";
import { ThirdwebProvider } from "thirdweb/react";
import { StorageClearer } from "@/components/storage-clearer";
import { SyncConnectedWallet } from "@/components/sync-wallets";
import AccountProvider from "@/components/thirdweb/account-provider";
import AutoConnect from "@/components/thirdweb/autoconnect";
import { TokenProvider } from "@/components/thirdweb/token-provider";
import { getQueryClient } from "@/lib/services/query";

export function Providers({
  children,
  deploymentId,
}: {
  children: React.ReactNode;
  deploymentId: string;
}) {
  const queryClient = getQueryClient();

  return (
    <>
      <StorageClearer deploymentId={deploymentId} />
      <ThirdwebProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ThirdwebProvider>
    </>
  );
}

export function PagesProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AutoConnect />
      <SyncConnectedWallet>
        <NuqsAdapter>
          <AccountProvider>
            <TokenProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </TokenProvider>
          </AccountProvider>
        </NuqsAdapter>
      </SyncConnectedWallet>
    </>
  );
}
