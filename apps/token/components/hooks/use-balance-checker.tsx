"use client";

import { Decimal } from "decimal.js";
import { useMemo } from "react";
import { useWalletBalance } from "thirdweb/react";
import useActiveAccount from "@/components/hooks/use-active-account";
import { client } from "@/lib/auth/thirdweb-client";

interface UseBalanceCheckerProps {
  /**
   * The required amount for the transaction
   */
  requiredAmount: string;
  /**
   * The payment token contract address
   */
  tokenAddress?: string;
  /**
   * Whether the token is native (like ETH, BNB)
   */
  isNativeToken?: boolean;
}

/**
 * Custom hook to check if the user has enough balance for a transaction
 * @param requiredAmount - The amount required for the transaction
 * @param tokenAddress - The token contract address (optional for native tokens)
 * @param isNativeToken - Whether the token is native (like ETH, BNB)
 * @returns boolean indicating if the user has sufficient balance
 */
export function useBalanceChecker({
  requiredAmount,
  tokenAddress,
  isNativeToken = false,
}: UseBalanceCheckerProps): boolean {
  const { activeAccount: account, chain } = useActiveAccount();

  const { data: balance } = useWalletBalance({
    client,
    address: account?.address,
    chain,
    tokenAddress: isNativeToken ? undefined : tokenAddress,
  });

  const hasSufficientBalance = useMemo(() => {
    // If no account is connected, return false
    if (!account?.address) return false;

    // If no balance data or required amount, return false
    if (!balance || !requiredAmount) return false;

    // If balance is loading, return false
    if (balance === undefined) return false;

    try {
      const balanceDecimal = new Decimal(balance.displayValue);
      const requiredDecimal = new Decimal(requiredAmount);

      // Return true if balance is greater than or equal to required amount
      return balanceDecimal.greaterThanOrEqualTo(requiredDecimal);
    } catch (error) {
      // If there's an error parsing the amounts, return false
      console.error("Error checking balance:", error);
      return false;
    }
  }, [account?.address, balance, requiredAmount]);

  return hasSufficientBalance;
}
