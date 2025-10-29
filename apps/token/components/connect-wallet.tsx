"use client";

import { Skeleton } from "@mjs/ui/primitives/skeleton";
import { defineChain } from "thirdweb";
// import { bscTestnet, sepolia } from "thirdweb/chains";
import { ConnectButton } from "thirdweb/react";
import { Wallet } from "thirdweb/wallets";
import {
  doLogin,
  doLogout,
  getLoginPayload,
  isLoggedIn,
} from "@/lib/auth/actions";
import { client } from "@/lib/auth/thirdweb-client";
import { wallets } from "@/lib/auth/wallets";
import { useBlockchains } from "@/lib/services/api";
import { metadata } from "../common/config/site";
import useActiveAccount from "./hooks/use-active-account";

const localeMapping = {
  en: "en_US",
  es: "es_ES",
  fr: "fr_FR",
  de: "de_DE",
  ja: "ja_JP",
  ko: "ko_KR",
  // zh: 'zh_CN',
  // cn: 'zh_CN', // Chinese simplified (duplicate mapping)
  ru: "ru_RU",
  pt: "pt_BR",
  // it: 'it_IT',
} as const;

export const ConnectWallet = ({
  locale,
  autoConnect = false,
  ...props
}: {
  locale?: keyof typeof localeMapping;
  autoConnect?: boolean;
  onConnect?: (wallet: Wallet) => void;
  chains: { chainId: number }[];
}) => {
  const mappedLocale = locale ? localeMapping[locale] : "en_US";
  const { signout } = useActiveAccount();

  const onConnect = (wallet: Wallet) => {
    props.onConnect?.(wallet);
  };

  return (
    <ConnectButton
      client={client}
      wallets={wallets}
      appMetadata={{
        name: metadata.businessName,
        url: metadata.siteUrl,
      }}
      connectButton={{ label: "Connect" }}
      connectModal={{ size: "compact" }}
      // accountAbstraction={{
      //   chain: bscTestnet, // ethereum, // replace with the chain you want
      //   sponsorGas: false,
      //   // factoryAddress: '',
      // }}

      detailsModal={{
        // https://portal.thirdweb.com/references/typescript/v5/ConnectButton_detailsModalOptions
        manageWallet: {
          allowLinkingProfiles: false,
        },
      }}
      autoConnect={autoConnect}
      onDisconnect={async () => {
        await signout();
      }}
      locale={mappedLocale}
      onConnect={onConnect}
      chains={props.chains.map((chain) => defineChain(chain.chainId))}
      // For SIWE
      auth={{
        // The following methods run on the server (not client)!
        isLoggedIn,
        doLogin,
        getLoginPayload,
        doLogout,
      }}
    />
  );
};

export const ConnectWalletWithChains = () => {
  const { data, isLoading, error } = useBlockchains();

  if (isLoading) {
    return <Skeleton className="w-full min-w-[165px] h-10" />;
  }
  if (error) {
    throw new Error("Failed to load blockchains");
  }
  return <ConnectWallet chains={data?.chains || []} />;
};
