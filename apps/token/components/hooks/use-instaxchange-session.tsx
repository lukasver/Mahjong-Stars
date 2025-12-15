"use client";

import { toast } from "@mjs/ui/primitives/sonner";
import { Decimal } from "decimal.js";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { createInstaxchangeSession } from "@/lib/actions";

interface UseInstaxchangeSessionProps {
  /**
   * The transaction ID
   */
  transactionId: string | null | undefined;
  /**
   * The total amount to pay
   */
  totalAmount: string | Decimal | null | undefined;
  /**
   * The currency code of the payment
   */
  paidCurrency: string | null | undefined;
  /**
   * Optional callback when an error occurs
   */
  onError?: (error: string) => void;
}

interface UseInstaxchangeSessionReturn {
  /**
   * The session URL for the Instaxchange payment iframe, or null if not available
   */
  sessionUrl: string | null;
  /**
   * Whether the session creation is in progress
   */
  isLoading: boolean;
  /**
   * Error message if session creation failed
   */
  error: string | null;
  /**
   * The status of the createSession action
   */
  status: "idle" | "executing" | "hasSucceeded" | "hasErrored";
}

/**
 * Custom hook to create an Instaxchange payment session
 * @param transactionId - The transaction ID
 * @param totalAmount - The total amount to pay (as string, Decimal, or null/undefined)
 * @param paidCurrency - The currency code of the payment
 * @param onError - Optional callback when an error occurs
 * @returns Object containing sessionUrl, isLoading, error, and status
 */
export function useInstaxchangeSession({
  transactionId,
  totalAmount,
  paidCurrency,
  onError,
}: UseInstaxchangeSessionProps): UseInstaxchangeSessionReturn {
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { execute: createSession, status } = useAction(
    createInstaxchangeSession,
    {
      onSuccess: ({ data }) => {
        if (data?.sessionUrl) {
          setSessionUrl(data.sessionUrl);
          setIsLoading(false);
          setError(null);
        } else {
          const errorMsg = "Failed to create payment session";
          setError(errorMsg);
          setIsLoading(false);
          onError?.(errorMsg);
        }
      },
      onError: (error) => {
        const errorMsg =
          error.error?.serverError ||
          error.error?.validationErrors?._errors?.[0] ||
          "Failed to create payment session";
        setError(errorMsg);
        setIsLoading(false);
        toast.error("Payment Error", {
          description: errorMsg,
        });
        onError?.(errorMsg);
      },
    },
  );

  /**
   * Creates the Instaxchange payment session
   */
  useEffect(() => {
    if (!transactionId) {
      setError("Transaction not found");
      setIsLoading(false);
      return;
    }

    if (!totalAmount || !paidCurrency) {
      setIsLoading(false);
      return;
    }
    // Convert amount to number for API
    const amount =
      totalAmount instanceof Decimal
        ? totalAmount.toString()
        : new Decimal(totalAmount).toString();
    createSession({
      transactionId,
      amount,
      currency: paidCurrency,
    });
  }, [transactionId, totalAmount, paidCurrency, createSession]);

  return { sessionUrl, isLoading, error, status };
}

