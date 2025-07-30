'use client';

import { Stepper } from '@/components/stepper';
import { Card } from '@mjs/ui/primitives/card';
import { getGlassyCardClassName } from '@mjs/ui/components/cards';

interface FormStepperProps {
  className?: string;
  steps: { id: number; name: string; description: string }[];
  step: number;
  setStep: (step: number) => void;
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
}: FormStepperProps) {
  return (
    <Card className={getGlassyCardClassName('px-4')}>
      <Stepper
        currentStep={step}
        steps={steps}
        className={className}
        onStepClick={(e) => {
          if (process.env.NODE_ENV === 'production') {
            return;
          }
          setStep(e);
        }}
        disableClick={process.env.NODE_ENV === 'production'}
      />
    </Card>
  );
}
