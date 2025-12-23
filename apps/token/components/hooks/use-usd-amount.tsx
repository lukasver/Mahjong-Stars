"use client";

import Decimal from "decimal.js";
import { useEffect, useState } from "react";
import calculator from "@/lib/services/pricefeeds";

interface UseUsdAmountProps {
  /**
   * The amount to convert to USD
   */
  amount: string | Decimal | null | undefined;
  /**
   * The currency of the amount
   */
  currency: string | null | undefined;
  /**
   * Whether the conversion is enabled
   */
  enabled?: boolean;
}

interface UseUsdAmountReturn {
  /**
   * The converted USD amount as a Decimal, or null if conversion failed/not available
   */
  usdAmount: Decimal | null;
  /**
   * Whether the conversion is in progress
   */
  isLoading: boolean;
  /**
   * Error message if conversion failed
   */
  error: string | null;
}

/**
 * Custom hook to convert a transaction amount to USD for threshold checking
 * @param amount - The amount to convert (as string, Decimal, or null/undefined)
 * @param currency - The currency code of the amount
 * @returns Object containing usdAmount (Decimal | null), isLoading (boolean), and error (string | null)
 */
export function useUsdAmount({
  amount,
  currency,
  enabled = true,
}: UseUsdAmountProps): UseUsdAmountReturn {
  const [usdAmount, setUsdAmount] = useState<Decimal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    const convertToUsd = async () => {
      // Reset state
      setIsLoading(true);
      setError(null);

      // Validate inputs
      if (!amount || !currency) {
        setUsdAmount(null);
        setIsLoading(false);
        return;
      }

      try {
        // Convert amount to Decimal if it's a string
        const amountDecimal =
          amount instanceof Decimal ? amount : new Decimal(amount);

        // If already USD, no conversion needed
        if (currency === "USD") {
          setUsdAmount(amountDecimal);
          setIsLoading(false);
          return;
        }

        // Convert to USD using the calculator service
        const conversion = await calculator.convertToCurrency({
          amount: amountDecimal.toString(),
          fromCurrency: currency,
          toCurrency: "USD",
          precision: 8,
        });

        console.log("🚀 ~ use-usd-amount.tsx:89 ~ conversion:", conversion);


        setUsdAmount(new Decimal(conversion.amount));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to convert to USD";
        console.error("Error converting to USD:", err);
        setError(errorMessage);
        setUsdAmount(null);
      } finally {
        setIsLoading(false);
      }
    };

    convertToUsd();
  }, [amount, currency, enabled]);

  return { usdAmount, isLoading, error };
}
