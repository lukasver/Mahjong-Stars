"use client";

import { motion } from "@mjs/ui/components/motion";
import PaymentMethodSelector, {
  PaymentMethodSelectorSkeleton,
} from "@mjs/ui/components/payment-options";
import { useCallback, useEffect, useRef, useState } from "react";
import { TransactionByIdWithRelations } from "@/common/types/transactions";
import { useInstaxchangeSession } from "@/components/hooks/use-instaxchange-session";
import { PulseLoader } from "@/components/pulse-loader";
import { CreateSessionRequest } from "@/lib/services/instaxchange/types";

export type SuccessInstaxchangePaymentData = {
  id: string;
  comment?: string;
  transactionHash: string;
  amountPaid: string;
  paidCurrency: string;
  formOfPayment: "CARD";
  paymentDate: Date;
  metadata?: Record<string, unknown>;
};

/**
 * Instaxchange payment widget component props
 */
interface InstaxchangeWidgetProps {
  txId: TransactionByIdWithRelations["id"];
  method: CreateSessionRequest["method"];
  onSuccess: (data: SuccessInstaxchangePaymentData) => void;
  onError?: (error: string) => void;
  errorComponent?: React.ReactNode;
}

/**
 * Instaxchange payment widget component
 * Embeds Instaxchange iframe for Apple Pay/Google Pay payments
 */
const InstaxchangeWidgetComponent = ({
  txId,
  method,
  onSuccess,
  onError,
  errorComponent = null
}: InstaxchangeWidgetProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { sessionUrl, isLoading, error } = useInstaxchangeSession({
    transactionId: txId,
    method,
    onError,
  });

  if (isLoading) {
    return <PaymentMethodSelectorSkeleton />;
  }

  // Combine session creation error and payment error
  const displayError = error;

  if (displayError && !sessionUrl) {
    return (errorComponent ||
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
      <div className="space-y-4 p-4 mx-auto w-full">
        <PulseLoader text="Preparing payment session..." />
      </div>
    );
  }

  return (
    // <Activity mode={!sessionUrl ? "visible" : "hidden"}>
    <StaggeredRevealAnimation isVisible={!!sessionUrl}>
      <div className="space-y-4">
        <div className="relative w-full">
          {/* {isProcessing && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="text-center">
                <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="text-sm font-medium">Processing payment...</p>
              </div>
            </div>
          )} */}

          {sessionUrl && <Iframe src={sessionUrl} ref={iframeRef} />}

          {/* {paymentError && (
          <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{paymentError}</p>
          </div>
        )} */}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Alert
            className='border-secondary-300'
          >
            <Icons.infoCircle className="stroke-secondary-300" />
            <AlertDescription className="text-foreground">
              Your payment is processed securely by our partner's. We take care
              of the processing fees for you 😉
            </AlertDescription>
          </Alert>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <Alert
            className='border-secondary-300'
          >
            <AlertTriangle className="stroke-destructive" />
            {/* <AlertTitle className="text-secondary-300">Notice: Accuracy of Information Required</AlertTitle> */}
            <AlertDescription className="text-foreground">
              Avoid changing the recipient address after the payment is
              initiated, this could result in your transaction being cancelled
              and your funds being lost.
            </AlertDescription>
          </Alert>
        </motion.div>
      </div>
    </StaggeredRevealAnimation>
    // </Activity>
  );
};

import { Icons } from "@mjs/ui/components/icons";
import { StaggeredRevealAnimation } from "@mjs/ui/components/motion";
import { Alert, AlertDescription } from "@mjs/ui/primitives/alert";
import { AlertTriangle } from "lucide-react";
import { memo } from "react";

const Iframe = memo(function Iframe({
  src,
  ref,
}: {
  src: string;
  ref: React.RefObject<HTMLIFrameElement | null>;
}) {

  const handleIframeMessage = useCallback(
    (event: unknown) => {
      console.debug('EVENT:', event);
    },
    [ref?.current],
  );

  /**
   * Set up postMessage listener for iframe communication
   */
  useEffect(() => {
    if (ref.current) {
      ref.current.addEventListener("message", handleIframeMessage);
    }
    return () => {
      ref.current?.removeEventListener("message", handleIframeMessage);
    };
  }, [handleIframeMessage, ref]);

  return (
    <iframe
      ref={ref}
      src={src}
      title="Instaxchange Payment"
      className="h-full w-full rounded-lg border border-border min-h-[90vh] md:min-h-screen]"
      allow="clipboard-read; clipboard-write; fullscreen; payment"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      referrerPolicy="strict-origin-when-cross-origin"
      style={{
        width: "100%",
        height: "100%",
        border: "0",
      }}
      allowFullScreen
    // onError={handleIframeError}
    // onLoad={handleIframeLoad}
    />
  );
});

type PaymentProcessors = Extract<
  CreateSessionRequest["method"],
  "card" | "apple-pay" | "google-pay"
>;

export const Instaxchange = InstaxchangeWidgetComponent;

/**
 * Instaxchange component with paymentp processor selection
 */
export const InstaxchangeWidget = ({
  txId,
  onSuccess,
  onError,
}: Omit<InstaxchangeWidgetProps, "method">) => {
  const [paymentProcessor, setPaymentProcessor] =
    useState<null | PaymentProcessors>(null);

  if (!paymentProcessor) {
    return (
      <PaymentMethodSelector
        className="p-6 md:p-0 pt-0"
        onSelect={(method) => {
          if (
            method === "card" ||
            method === "apple-pay" ||
            method === "google-pay"
          ) {
            setPaymentProcessor(method);
          }
        }}
        allowedMethods={
          ["card", "apple-pay", "google-pay"] as PaymentProcessors[]
        }
      />
    );
  }

  return (
    <Instaxchange
      method={paymentProcessor}
      txId={txId}
      onSuccess={onSuccess}
      onError={onError}
    />
  );
};
