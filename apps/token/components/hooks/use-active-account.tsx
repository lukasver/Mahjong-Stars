"use client";
import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import {
  useActiveAccount as useActiveAccountThirdweb,
  useActiveWallet,
  useActiveWalletChain,
  useActiveWalletConnectionStatus,
  useDisconnect,
} from "thirdweb/react";
import { getQueryClient } from "@/lib/services/query";

function useActiveAccount() {
  const ac = useActiveAccountThirdweb();
  const status = useActiveWalletConnectionStatus();
  const wallet = useActiveWallet();
  const activeChain = useActiveWalletChain();
  const router = useRouter();

  // const { data: profiles } = useProfiles({
  //   client,
  // });

  const { disconnect } = useDisconnect();
  const [isPending, startTransition] = useTransition();

  const signout = useCallback(() => {
    startTransition(async () => {
      if (wallet) {
        disconnect(wallet);
        getQueryClient().clear();
      }
      // await logout({ redirectTo: "/", redirect: true });
      router.push("/in?logout=true");
    });
  }, [wallet, disconnect]);

  const signMessage = useCallback(
    async (message: string) => {
      if (!ac) {
        throw new Error("No wallet connected");
      }
      return ac.signMessage({ message, chainId: wallet?.getChain()?.id });
    },
    [!!ac, !!wallet],
  );

  const chain = activeChain || wallet?.getChain();
  return {
    activeAccount: ac,
    status,
    isLoading: isPending || status === "connecting",
    isConnected: status === "connected",
    signout,
    signMessage,
    chainId: chain?.id,
    chain,
  };
}

export default useActiveAccount;
