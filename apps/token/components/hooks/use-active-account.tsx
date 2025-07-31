'use client';
import { logout } from '@/lib/actions';
import { useCallback, useTransition } from 'react';
import {
  useActiveAccount as useActiveAccountThirdweb,
  useActiveWallet,
  useActiveWalletConnectionStatus,
  useDisconnect,
} from 'thirdweb/react';

function useActiveAccount() {
  const ac = useActiveAccountThirdweb();
  const status = useActiveWalletConnectionStatus();
  const wallet = useActiveWallet();

  // const { data: profiles } = useProfiles({
  //   client,
  // });

  const { disconnect } = useDisconnect();
  const [isPending, startTransition] = useTransition();

  const signout = useCallback(() => {
    startTransition(async () => {
      if (wallet) {
        disconnect(wallet);
      }
      await logout();
    });
  }, [wallet, disconnect]);

  const signMessage = useCallback(
    async (message: string) => {
      if (!ac) {
        throw new Error('No wallet connected');
      }
      return ac.signMessage({ message, chainId: wallet?.getChain()?.id });
    },
    [!!ac, !!wallet]
  );

  return {
    activeAccount: ac,
    status,
    isLoading: isPending || status === 'connecting',
    isConnected: status === 'connected',
    signout,
    signMessage,
    chainId: wallet?.getChain()?.id,
  };
}

export default useActiveAccount;
