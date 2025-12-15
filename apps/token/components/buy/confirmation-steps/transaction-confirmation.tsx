"use client";

import { getGlassyCardClassName } from "@mjs/ui/components/cards";
import ErrorBoundary from "@mjs/ui/components/error-boundary";
import { AnimatePresence, motion } from "@mjs/ui/components/motion";
import { Card } from "@mjs/ui/primitives/card";
import { useState } from "react";
import { getQueryClient } from "@/lib/services/query";
import { ConfirmationStep } from "./confirmation-step";
import { FormStepper } from "./form-stepper";
import { KycUploadStep } from "./kyc-upload-step";
import { PaymentStep } from "./payment-step";
import { PaymentAvailabilityGuard } from "./payment-step-guard";
import { SaftReviewStep } from "./saft-review-step";

interface TransactionConfirmationProps {
  steps: { id: number; name: string; description: string }[];
  initialStep: { id: number; name: string; description: string };
  transactionId: string;
}

/**
 * Main Transaction Confirmation Component
 * Orchestrates the flow between different confirmation steps.
 */
export function TransactionConfirmation({
  steps,
  initialStep,
  transactionId,
}: TransactionConfirmationProps) {
  const [step, setStep] = useState<(typeof steps)[number]>(
    initialStep || steps[0],
  );

  const handleStepChange = (step: number) => {
    const foundStep = steps.find((s) => s.id === step);
    if (foundStep) {
      setStep(foundStep);
    }
  };

  return (
    <ErrorBoundary fallback={<div>Error with transaction confirmation</div>}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="container mx-auto p-4 space-y-4 max-w-4xl min-h-[80dvh]"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <FormStepper
            steps={steps}
            step={step.id}
            setStep={handleStepChange}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
        >
          <Card
            className={getGlassyCardClassName("flex flex-col justify-center")}
          >
            <AnimatePresence mode="wait">
              {step.name === "KYC" && (
                <motion.div
                  key="kyc"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <KycUploadStep
                    transactionId={transactionId}
                    onSuccess={() => {
                      const nextStep = steps.find(
                        (s) => s.name === "SAFT" || s.name === "Payment",
                      );
                      setStep(nextStep || steps[1]!);
                    }}
                  />
                </motion.div>
              )}
              {step.name === "SAFT" && (
                <motion.div
                  key="saft"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <SaftReviewStep
                    onSuccess={() =>
                      setStep(steps.find((s) => s.name === "Payment")!)
                    }
                  />
                </motion.div>
              )}
              {step.name === "Payment" && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <PaymentAvailabilityGuard>
                    <PaymentStep
                      onSuccess={() => {
                        getQueryClient().invalidateQueries({
                          queryKey: ["transactions"],
                        });
                        setStep(steps.find((s) => s.name === "Confirmation")!);
                      }}
                    />
                  </PaymentAvailabilityGuard>
                </motion.div>
              )}
              {step.name === "Confirmation" && (
                <motion.div
                  key="confirmation"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <ConfirmationStep />
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </motion.div>
    </ErrorBoundary>
  );
}
