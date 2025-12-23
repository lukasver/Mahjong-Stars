"use client";

import { toast } from "@mjs/ui/primitives/sonner";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { createInstaxchangeSession } from "@/lib/actions";
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
  method,
  onError,
}: UseInstaxchangeSessionProps): UseInstaxchangeSessionReturn {
  const [sessionUrl, setSessionUrl] = useState<{ method: UseInstaxchangeSessionProps["method"]; url: string } | null>(null);

  // useLocalStorage<{ method: UseInstaxchangeSessionProps["method"]; url: string } | null>(
  //   `mjs-tx-${transactionId}`,
  //   null,
  // );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { execute: createSession, status } = useAction(
    createInstaxchangeSession,
    {
      onSuccess: ({ data }) => {
        console.debug('DATA=>>', data);
        if (data?.iframeUrl) {
          setSessionUrl({ method, url: data.iframeUrl });
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
    if (sessionUrl?.url) {
      setIsLoading(false);
      return;
    }
    if (!transactionId || !method) {
      setError("idle");
      setIsLoading(false);
      return;
    }
    createSession({
      transactionId,
      method,
    });
  }, [transactionId, method, createSession, sessionUrl]);

  return { sessionUrl: sessionUrl?.url || null, isLoading, error, status };
}
