"use client";

import { useEffect, useState } from "react";
import { createPaymentSession } from "@/lib/services/fetchers";
import { CreateSessionRequest } from "@/lib/services/instaxchange/types";

interface UseInstaxchangeSessionProps {
  /**
   * The transaction ID
   */
  transactionId: string | null | undefined;
  /**
   * The processor to be used for payment
   */
  method: CreateSessionRequest["method"];
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
  method,
  onError,
}: UseInstaxchangeSessionProps): UseInstaxchangeSessionReturn {
  const [sessionUrl, setSessionUrl] = useState<{
    method: UseInstaxchangeSessionProps["method"];
    url: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /**
   * Creates the Instaxchange payment session
   */
  useEffect(() => {
    (async () => {
      if (sessionUrl?.url) {
        setIsLoading(false);
        return;
      }
      if (!transactionId || !method) {
        setError("idle");
        setIsLoading(false);
        return;
      }
      const res = await createPaymentSession({
        transactionId,
        method,
      });


      if (res.error) {
        const msg = res.error instanceof Error ? res.error.message : "Failed to create payment session";
        setError(msg);
        onError?.(msg);
      }
      if (res.data?.iframeUrl) {
        setSessionUrl({ method, url: res.data.iframeUrl });
      }
      setIsLoading(false);
    })();
  }, []);

  return { sessionUrl: sessionUrl?.url || null, isLoading, error };
}
