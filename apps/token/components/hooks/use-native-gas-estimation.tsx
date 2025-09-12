"use client";
import { useState, useCallback } from "react";
import {
  getGasPrice,
  estimateGasCost,
  prepareTransaction, toUnits
} from 'thirdweb';
import { client } from "@/lib/auth/thirdweb-client";
import useActiveAccount from "./use-active-account";

/**
 * Hook to estimate gas costs for native token transfers
 * This can work even when the user doesn't have sufficient funds
 */
export function useNativeGasEstimation() {
  const [gasPrice, setGasPrice] = useState<string | null>(null);
  const [gasCost, setGasCost] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { activeAccount: account, chain } = useActiveAccount();

  const estimateGasForTransfer = useCallback(async (amount: string, to: string) => {
    if (!chain || !amount || !to) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get current gas price
      const currentGasPrice = await getGasPrice({ client, chain });


      setGasPrice(currentGasPrice.toString());

      // Create a mock transaction for gas estimation
      // We use a small amount to avoid issues with insufficient funds
      const amountInWei = toUnits(amount, 18);

      const mockTransaction = prepareTransaction({
        chain,
        client,
        value: amountInWei,
        to,
      });

      // Estimate gas cost
      const gasCostResult = await estimateGasCost({
        transaction: mockTransaction
      });


      setGasCost(gasCostResult.ether);
      return gasCostResult.ether;

    } catch (err) {
      console.error('Gas estimation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to estimate gas');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [chain]);

  const getEstimatedGasCost = useCallback(async (amount: string, to: string) => {
    return await estimateGasForTransfer(amount, to);
  }, [estimateGasForTransfer]);

  return {
    gasPrice,
    gasCost,
    isLoading,
    error,
    estimateGas: getEstimatedGasCost,
  };
}
