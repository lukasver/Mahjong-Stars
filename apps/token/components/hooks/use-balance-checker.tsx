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

interface UseBalanceCheckerReturn {
  /**
   * Whether the user has sufficient balance for the transaction
   */
  isSufficient: boolean;
  /**
   * The actual balance as a Decimal
   */
  balance: Decimal | null;
}

/**
 * Custom hook to check if the user has enough balance for a transaction
 * @param requiredAmount - The amount required for the transaction
 * @param tokenAddress - The token contract address (optional for native tokens)
 * @param isNativeToken - Whether the token is native (like ETH, BNB)
 * @returns object containing isSufficient flag and actual balance
 */
export function useBalanceChecker({
  requiredAmount,
  tokenAddress,
  isNativeToken = false,
}: UseBalanceCheckerProps): UseBalanceCheckerReturn {
  const { activeAccount: account, chain } = useActiveAccount();

  const { data: balance } = useWalletBalance({
    client,
    address: account?.address,
    chain,
    tokenAddress: isNativeToken ? undefined : tokenAddress,
  });

  const { isSufficient, balanceDecimal } = useMemo(() => {
    // If no account is connected, return false and null balance
    if (!account?.address) return { isSufficient: false, balanceDecimal: null };

    // If no balance data or required amount, return false and null balance
    if (!balance || !requiredAmount) return { isSufficient: false, balanceDecimal: null };

    // If balance is loading, return false and null balance
    if (balance === undefined) return { isSufficient: false, balanceDecimal: null };

    try {
      const balanceDecimal = new Decimal(balance.displayValue);


      const requiredDecimal = new Decimal(requiredAmount);

      // Return true if balance is greater than or equal to required amount
      const isSufficient = balanceDecimal.greaterThanOrEqualTo(requiredDecimal);
      return { isSufficient, balanceDecimal };
    } catch (error) {
      // If there's an error parsing the amounts, return false and null balance
      console.error("Error checking balance:", error);
      return { isSufficient: false, balanceDecimal: null };
    }
  }, [account?.address, balance, requiredAmount]);

  return { isSufficient, balance: balanceDecimal };
}
