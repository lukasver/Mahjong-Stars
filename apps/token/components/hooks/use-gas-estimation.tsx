"use client";
import { useEffect } from "react";
import { useNativeGasEstimation } from './use-native-gas-estimation';

export function useGasEstimation(amount: string, to: string) {
  const { gasCost, gasPrice, estimateGas } = useNativeGasEstimation();

  useEffect(() => {
    if (amount && to) {
      estimateGas(amount, to);
    }
  }, [amount, to, estimateGas])

  return {
    gasPrice,
    gasCost: gasCost,
  };
}

