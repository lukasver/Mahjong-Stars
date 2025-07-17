'use client';

import { client } from '@/lib/auth/thirdweb-client';
import { useActiveSale } from '@/lib/services/api';
import { bsc, bscTestnet } from 'thirdweb/chains';
import {
  TokenProvider as TokenProviderThirdweb,
  useActiveWalletChain,
} from 'thirdweb/react';

const defaultChain = process.env.NODE_ENV === 'production' ? bsc : bscTestnet;

export const TokenProvider = ({ children }: { children: React.ReactNode }) => {
  const chain = useActiveWalletChain();
  const { data: activeSale } = useActiveSale();

  return (
    <TokenProviderThirdweb
      address={activeSale?.tokenContractAddress || ''}
      client={client}
      chain={chain || defaultChain}
    >
      {children}
    </TokenProviderThirdweb>
  );
};
