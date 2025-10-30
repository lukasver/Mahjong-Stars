"use client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import {
  useActiveAccount as useActiveAccountThirdweb,
  useActiveWallet,
  useActiveWalletChain,
  useActiveWalletConnectionStatus
} from "thirdweb/react";

function useActiveAccount() {
  const ac = useActiveAccountThirdweb();
  const status = useActiveWalletConnectionStatus();
  const wallet = useActiveWallet();
  const activeChain = useActiveWalletChain();
  const router = useRouter();

  const signout = () => {
    router.push("/in?logout=true");
  }

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
    isLoading: status === "connecting",
    isConnected: status === "connected",
    signout,
    signMessage,
    chainId: chain?.id,
    chain,
  };
}

export default useActiveAccount;
