"use client";

import { StaggeredRevealAnimation } from "@mjs/ui/components/motion";
import PaymentMethodSelector, { PaymentMethod } from "@mjs/ui/components/payment-options";
import { toast } from "@mjs/ui/primitives/sonner";
import { useCallback, useEffect, useRef, useState } from "react";
import { FOPSchema } from "@/common/schemas/generated";
import { TransactionByIdWithRelations } from "@/common/types/transactions";
import { useInstaxchangeSession } from "@/components/hooks/use-instaxchange-session";
import { PulseLoader } from "@/components/pulse-loader";
import { OnRampSkeleton } from "./skeletons";
import { WithErrorHandler } from "./utils";

/**
 * Instaxchange payment widget component props
 */
interface InstaxchangeWidgetProps {
  transaction: TransactionByIdWithRelations;
  onSuccess: (data: {
    id: string;
    txHash: string;
    amountPaid: string;
    paidCurrency: string;
    formOfPayment: 'CARD';
    paymentDate: Date;
    metadata?: Record<string, unknown>;
  }) => void;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { sessionUrl, isLoading, error, status: createSessionStatus } =
    useInstaxchangeSession({
      transactionId: tx?.id,
      totalAmount: tx?.totalAmount,
      paidCurrency: tx?.paidCurrency,
      onError,
    });

  /**
   * TODO: revise instaxchange uses webhooks not iframe messages
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
            id: tx.id,
            txHash: message.transactionHash || "",
            amountPaid: message.amount?.toString() || tx.totalAmount.toString(),
            // Check the paid currency from instaxchange docs
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
          setPaymentError(errorMsg);
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
    setPaymentError(errorMsg);
    toast.error("Load Error", {
      description: errorMsg,
    });
    onError?.(errorMsg);
  }, [onError]);

  /**
   * Handle iframe load success
   */
  const handleIframeLoad = useCallback(() => {
    // Iframe loaded successfully
  }, []);

  if (createSessionStatus === "executing" || isLoading) {
    //TODO! check this skeleton
    return <OnRampSkeleton />;
  }

  // Combine session creation error and payment error
  const displayError = error || paymentError;

  if (displayError && !sessionUrl) {
    return (
      <div className="space-y-4 p-4">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <h3 className="font-semibold text-destructive">Payment Error</h3>
          <p className="text-sm text-destructive/80">{displayError}</p>
        </div>
      </div>
    );
  }

  if (!sessionUrl) {
    return (
      <div className="space-y-4 p-4">
        <PulseLoader text="Preparing payment session..." />
      </div>
    );
  }

  return (
    // <Activity mode={!sessionUrl ? "visible" : "hidden"}>
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

          {paymentError && (
            <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{paymentError}</p>
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
    // </Activity>
  );
};

type PaymentProcessors = Extract<
  PaymentMethod,
  "card" | "apple-pay" | "google-pay"
>;

export const Instaxchange = WithErrorHandler(InstaxchangeWidgetComponent);


/**
 * Instaxchange component with paymentp processor selection
 */
export const InstaxchangeWidget = ({
  transaction: tx,
  onSuccess,
  onError,
}: InstaxchangeWidgetProps) => {
  const [paymentProcessor, setPaymentProcessor] = useState<null | PaymentProcessors>(null);
  if (!paymentProcessor) {
    return (
      <PaymentMethodSelector
        onSelect={(method) => {
          if (method === "card" || method === "apple-pay" || method === "google-pay") {
            setPaymentProcessor(method);
          }
        }}
        allowedMethods={["card", "apple-pay", "google-pay"]}
      />
    );
  } else {
    return <Instaxchange transaction={tx} onSuccess={onSuccess} onError={onError} />
  }
};

