"use client"
import { SidebarProvider } from "@mjs/ui/primitives/sidebar";
import {
  QueryClientProvider
} from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type React from "react";
import { ThirdwebProvider } from "thirdweb/react";
import { SyncConnectedWallet } from "@/components/sync-wallets";
import AccountProvider from "@/components/thirdweb/account-provider";
import AutoConnect from "@/components/thirdweb/autoconnect";
import { TokenProvider } from "@/components/thirdweb/token-provider";
import { getQueryClient } from '@/lib/services/query';



export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <ThirdwebProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThirdwebProvider>
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
