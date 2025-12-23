"use client";

import PaymentMethodSelector from "@mjs/ui/components/payment-options";
import { useCallback, useRef, useState } from "react";
import { useReadLocalStorage } from "usehooks-ts";
import { TransactionByIdWithRelations } from "@/common/types/transactions";
import { useInstaxchangeSession } from "@/components/hooks/use-instaxchange-session";
import { PulseLoader } from "@/components/pulse-loader";
import { CreateSessionRequest } from "@/lib/services/instaxchange/types";
import { OnRampSkeleton } from "./skeletons";
import { WithErrorHandler } from "./utils";

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
}: InstaxchangeWidgetProps) => {
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const {
    sessionUrl,
    isLoading,
    error,
    status: createSessionStatus,
  } = useInstaxchangeSession({
    transactionId: txId,
    method,
    onError,
  });



  /**
   * Handle iframe load success
   */
  const handleIframeLoad = useCallback(() => {
    console.debug("Iframe loaded successfully");
    console.log("🚀 ~ instaxchange.tsx:58 ~ sessionUrl:", sessionUrl);

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
    // <StaggeredRevealAnimation isVisible={!!sessionUrl}>
    <div className="space-y-4">
      <div className="relative w-full" style={{ minHeight: "600px" }}>
        {/* {isProcessing && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="text-center">
                <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="text-sm font-medium">Processing payment...</p>
              </div>
            </div>
          )} */}

        <iframe
          ref={iframeRef}
          src={sessionUrl}
          title="Instaxchange Payment"
          className="h-full w-full rounded-lg border border-border"
          allow="clipboard-read; clipboard-write; fullscreen; payment"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerPolicy="strict-origin-when-cross-origin"
          style={{ width: "100%", height: "100%", border: "0", minHeight: "600px" }}
          allowFullScreen
          // onError={handleIframeError}
          onLoad={handleIframeLoad}
        />

        {paymentError && (
          <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{paymentError}</p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-muted bg-muted/10 p-4">
        <p className="text-xs text-foreground/80">
          Your payment is processed securely by Instaxchange.
        </p>
      </div>
    </div>
    // </StaggeredRevealAnimation>
    // </Activity>
  );
};

type PaymentProcessors = Extract<
  CreateSessionRequest["method"],
  "card" | "apple-pay" | "google-pay"
>;

export const Instaxchange = WithErrorHandler(InstaxchangeWidgetComponent);

/**
 * Instaxchange component with paymentp processor selection
 */
export const InstaxchangeWidget = ({
  txId,
  onSuccess,
  onError,
}: Omit<InstaxchangeWidgetProps, "method">) => {
  const ls = useReadLocalStorage<{
    method: PaymentProcessors;
    url: string;
  } | null>(`mjs-tx-${txId}`);
  const [paymentProcessor, setPaymentProcessor] =
    useState<null | PaymentProcessors>(ls?.method || null);

  if (!paymentProcessor && (!ls?.method || !ls?.url)) {
    return (
      <PaymentMethodSelector
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
  } else {
    return (
      <Instaxchange
        method={paymentProcessor || ls?.method || undefined}
        txId={txId}
        onSuccess={onSuccess}
        onError={onError}
      />
    );
  }
};
