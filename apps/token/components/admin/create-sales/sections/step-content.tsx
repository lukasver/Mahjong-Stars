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
    <ErrorBoundary
      fallback={
        <FormError type="custom" message="Error with creating sale section" />
      }
    >
      <div className="flex flex-col gap-4 min-h-[300px] h-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <TokenInformation saleId={saleId} step={step} />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <SaftInformation saleId={saleId} />
            </motion.div>
          )}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <PaymentInformation saleId={saleId} />
            </motion.div>
          )}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ProjectInformation saleId={saleId} />
            </motion.div>
          )}
        </AnimatePresence>
        {children}
      </div>
    </ErrorBoundary>
  );
};
