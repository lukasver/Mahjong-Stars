"use client";

import { getGlassyCardClassName } from "@mjs/ui/components/cards";
import { Card } from "@mjs/ui/primitives/card";
import { Stepper } from "@/components/stepper";

interface FormStepperProps {
  className?: string;
  steps: { id: number; name: string; description: string }[];
  step: number;
  setStep: (step: number) => void;
  dataTestId?: string;
}

/**
 * Form Stepper Component
 * Displays the current step progress and allows navigation between steps.
 */
export function FormStepper({
  className,
  steps,
  step,
  setStep,
  dataTestId,
}: FormStepperProps) {
  return (
    <Card className={getGlassyCardClassName("px-2 sm:px-4")}>
      <Stepper
        currentStep={step}
        steps={steps}
        className={className}
        onStepClick={(e) => {
          if (process.env.NODE_ENV === "production") {
            return;
          }
          setStep(e);
        }}
        dataTestId={dataTestId}
        disableClick={process.env.NODE_ENV === "production"}
      />
    </Card>
  );
}
