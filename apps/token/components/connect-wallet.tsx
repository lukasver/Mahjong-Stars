'use client';
import {
  doLogin,
  doLogout,
  getLoginPayload,
  isLoggedIn,
} from '@/lib/auth/functions';
import { client } from '@/lib/auth/thirdweb-client';
import { wallets } from '@/lib/auth/wallets';
import { bscTestnet, sepolia } from 'thirdweb/chains';
import { ConnectButton } from 'thirdweb/react';
import { Wallet } from 'thirdweb/wallets';
import { metadata } from '../common/config/site';
import useActiveAccount from './hooks/use-active-account';

const localeMapping = {
  en: 'en_US',
  es: 'es_ES',
  fr: 'fr_FR',
  de: 'de_DE',
  ja: 'ja_JP',
  ko: 'ko_KR',
  // zh: 'zh_CN',
  // cn: 'zh_CN', // Chinese simplified (duplicate mapping)
  ru: 'ru_RU',
  pt: 'pt_BR',
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
}) => {
  const mappedLocale = locale ? localeMapping[locale] : 'en_US';
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
      connectButton={{ label: 'Connect' }}
      connectModal={{ size: 'compact' }}
      // accountAbstraction={{
      //   chain: bscTestnet, // ethereum, // replace with the chain you want
      //   sponsorGas: false,
      //   // factoryAddress: '0x8f75517e97e0bB99A2E2132FDe0bBaC5815Bac70',
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
      chains={[bscTestnet, sepolia]}
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
