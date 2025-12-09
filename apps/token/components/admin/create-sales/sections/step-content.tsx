"use client";

import ErrorBoundary from "@mjs/ui/components/error-boundary";
import { AnimatePresence, motion } from "@mjs/ui/components/motion";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { FormError } from "@/components/form-error";
import {
  PaymentInformation,
  ProjectInformation,
  SaftInformation,
  TokenInformation,
} from "./";

export const StepContent = ({ children }: { children?: React.ReactNode }) => {
  const [step] = useQueryState(
    "step",
    parseAsInteger.withDefault(1).withOptions({ shallow: true }),
  );
  const [saleId] = useQueryState("saleId", parseAsString.withDefault(""));

  if (!step) return null;

  return (
    <div className="flex flex-col gap-4 min-h-[300px] h-full">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <ErrorWrapper title="Error with creating sale token information section">
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <TokenInformation saleId={saleId} step={step} />
            </motion.div>
          </ErrorWrapper>
        )}
        {step === 2 && (
          <ErrorWrapper title="Error with creating sale SAFT section">
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <SaftInformation saleId={saleId} />
            </motion.div>
          </ErrorWrapper>
        )}
        {step === 3 && (
          <ErrorWrapper title="Error with creating sale payments section">
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <PaymentInformation saleId={saleId} />
            </motion.div>
          </ErrorWrapper>
        )}
        {step === 4 && (
          <ErrorWrapper title="Error with creating sale information section">
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ProjectInformation saleId={saleId} />
            </motion.div>
          </ErrorWrapper>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
};


const ErrorWrapper = ({ children, title, message }: { children: React.ReactNode, title: string, message?: string }) => {
  return (
    <ErrorBoundary
      fallback={
        <FormError type="custom" title={title} message={message} />
      }
    >
      {children}
    </ErrorBoundary>
  );
};
