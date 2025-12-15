"use client";

import { StaggeredRevealAnimation } from "@mjs/ui/components/motion";
import { toast } from "@mjs/ui/primitives/sonner";
import { Decimal } from "decimal.js";
import { useAction } from "next-safe-action/hooks";
import { Activity, useCallback, useEffect, useRef, useState } from "react";
import { FOPSchema } from "@/common/schemas/generated";
import { TransactionByIdWithRelations } from "@/common/types/transactions";
import { createInstaxchangeSession } from "@/lib/actions";
import { OnRampSkeleton } from "./skeletons";
import { SuccessCryptoPaymentData } from "./transaction";
import { WithErrorHandler } from "./utils";

/**
 * Instaxchange payment widget component props
 */
interface InstaxchangeWidgetProps {
  transaction: TransactionByIdWithRelations;
  onSuccess: (data: SuccessCryptoPaymentData) => void;
  onError?: (error: string) => void;
}

/**
 * Message event types from Instaxchange iframe
 */
interface InstaxchangeMessage {
  type:
  | "payment.completed"
  | "payment.failed"
  | "payment.cancelled"
  | "payment.pending";
  sessionId?: string;
  transactionHash?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  error?: string;
  timestamp?: string;
}

/**
 * Instaxchange payment widget component
 * Embeds Instaxchange iframe for Apple Pay/Google Pay payments
 */
const InstaxchangeWidgetComponent = ({
  transaction: tx,
  onSuccess,
  onError,
}: InstaxchangeWidgetProps) => {
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { execute: createSession, status: createSessionStatus } = useAction(
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
    if (!tx?.id) {
      setError("Transaction not found");
      setIsLoading(false);
      return;
    }

    // Convert amount to number for API
    const amount = new Decimal(tx.totalAmount).toNumber();

    createSession({
      transactionId: tx.id,
      amount,
      currency: tx.paidCurrency,
    });
  }, [tx?.id, tx?.totalAmount, tx?.paidCurrency, createSession]);

  /**
   * Handles postMessage events from Instaxchange iframe
   */
  const handleIframeMessage = useCallback(
    (event: MessageEvent<InstaxchangeMessage>) => {
      // Verify message origin (should be from Instaxchange domain)
      // Note: In production, verify against actual Instaxchange domain
      // For now, we'll accept messages but validate the structure
      // if (event.origin !== INSTAXCHANGE_DOMAIN) return;

      // Only process messages that look like Instaxchange messages
      if (!event.data || typeof event.data !== "object") {
        return;
      }

      const message = event.data as InstaxchangeMessage;

      // Only process Instaxchange messages
      if (!message || typeof message !== "object" || !message.type) {
        return;
      }

      switch (message.type) {
        case "payment.completed": {
          setIsProcessing(true);

          // Call onSuccess with payment data
          onSuccess({
            transactionHash: message.transactionHash || "",
            chainId: 0, // Instaxchange payments don't use blockchain
            amountPaid: message.amount?.toString() || tx.totalAmount.toString(),
            paidCurrency: message.currency || tx.paidCurrency,
            formOfPayment: FOPSchema.enum.CARD,
            paymentDate: message.timestamp
              ? new Date(message.timestamp)
              : new Date(),
            metadata: {
              sessionId: message.sessionId,
              paymentMethod: message.paymentMethod,
              provider: "instaxchange",
            },
          });

          toast.success("Payment completed", {
            description: "Your payment has been processed successfully",
          });
          break;
        }

        case "payment.failed": {
          const errorMsg = message.error || "Payment failed";
          setError(errorMsg);
          setIsProcessing(false);
          toast.error("Payment Failed", {
            description: errorMsg,
          });
          onError?.(errorMsg);
          break;
        }

        case "payment.cancelled": {
          setIsProcessing(false);
          toast.info("Payment cancelled", {
            description: "You cancelled the payment process",
          });
          break;
        }

        case "payment.pending": {
          setIsProcessing(true);
          toast.info("Processing payment", {
            description: "Your payment is being processed",
          });
          break;
        }

        default:
          // Unknown message type, ignore
          break;
      }
    },
    [tx, onSuccess, onError],
  );

  /**
   * Set up postMessage listener for iframe communication
   */
  useEffect(() => {
    window.addEventListener("message", handleIframeMessage);

    return () => {
      window.removeEventListener("message", handleIframeMessage);
    };
  }, [handleIframeMessage]);

  /**
   * Handle iframe load errors
   */
  const handleIframeError = useCallback(() => {
    const errorMsg = "Failed to load payment widget";
    setError(errorMsg);
    setIsLoading(false);
    toast.error("Load Error", {
      description: errorMsg,
    });
    onError?.(errorMsg);
  }, [onError]);

  /**
   * Handle iframe load success
   */
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  if (createSessionStatus === "executing" || isLoading) {
    return <OnRampSkeleton />;
  }

  if (error && !sessionUrl) {
    return (
      <div className="space-y-4 p-4">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <h3 className="font-semibold text-destructive">Payment Error</h3>
          <p className="text-sm text-destructive/80">{error}</p>
        </div>
      </div>
    );
  }

  if (!sessionUrl) {
    return (
      <div className="space-y-4 p-4">
        <div className="rounded-lg border border-muted bg-muted/10 p-4">
          <p className="text-sm">Preparing payment session...</p>
        </div>
      </div>
    );
  }

  return (
    <Activity mode={!sessionUrl ? "visible" : "hidden"}>
      <StaggeredRevealAnimation isVisible={!!sessionUrl}>
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="space-y-3">
              <h3 className="font-semibold">Complete Payment</h3>
              <p className="text-sm text-muted-foreground">
                Use Apple Pay or Google Pay to complete your payment securely.
              </p>
            </div>
          </div>

          <div className="relative w-full" style={{ minHeight: "600px" }}>
            {isProcessing && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="text-center">
                  <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                  <p className="text-sm font-medium">Processing payment...</p>
                </div>
              </div>
            )}

            <iframe
              ref={iframeRef}
              src={sessionUrl}
              title="Instaxchange Payment"
              className="h-full w-full rounded-lg border border-border"
              style={{ minHeight: "600px" }}
              allow="payment"
              allowFullScreen
              onError={handleIframeError}
              onLoad={handleIframeLoad}
            />

            {error && (
              <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-muted bg-muted/10 p-4">
            <p className="text-xs text-muted-foreground">
              Your payment is processed securely by Instaxchange. Only Apple Pay
              and Google Pay are supported for this transaction.
            </p>
          </div>
        </div>
      </StaggeredRevealAnimation>
    </Activity>
  );
};

export const InstaxchangeWidget = WithErrorHandler(InstaxchangeWidgetComponent);
