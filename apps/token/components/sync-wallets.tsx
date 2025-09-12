"use client";

import { usePrevious } from "@mjs/ui/hooks";
import { useEffect } from "react";
import useActiveAccount from "./hooks/use-active-account";
import { useRouter } from 'next/navigation';
import { useActiveWalletChain } from 'thirdweb/react';

export const SyncConnectedWallet = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const { signout, activeAccount } = useActiveAccount();
	const activeChain = useActiveWalletChain();
	const prev = usePrevious(activeAccount?.address);
	const prevChain = usePrevious(activeChain?.id);
	const router = useRouter();
	const chainId = activeChain?.id;


	useEffect(() => {
		// If prev exists but is different than current, we need force the user to log in again to ensure session is updated with active account
		// TODO: find a better way to do this in future
		if (prev && prev !== activeAccount?.address) {
			signout?.();
		}
	}, [prev]);

	useEffect(() => {
		// If user changes chain, we need to refresh the page to ensure the correct chain is loaded
		if (chainId && prevChain && prevChain !== chainId) {
			router.refresh();
		}
	}, [prevChain, chainId]);

	return children;
};
