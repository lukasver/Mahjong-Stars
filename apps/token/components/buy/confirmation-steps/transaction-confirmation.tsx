'use client';

import { useState } from 'react';
import ErrorBoundary from '@mjs/ui/components/error-boundary';
import { AnimatePresence } from '@mjs/ui/components/motion';
import { Card } from '@mjs/ui/primitives/card';
import { getGlassyCardClassName } from '@mjs/ui/components/cards';
import { KycUploadStep } from './kyc-upload-step';
import { SaftReviewStep } from './saft-review-step';
import { PaymentAvailabilityGuard, PaymentStep } from './payment-step';
import { ConfirmationStep } from './confirmation-step';
import { FormStepper } from './form-stepper';

interface TransactionConfirmationProps {
  steps: { id: number; name: string; description: string }[];
  initialStep: { id: number; name: string; description: string };
}

/**
 * Main Transaction Confirmation Component
 * Orchestrates the flow between different confirmation steps.
 */
export function TransactionConfirmation({
  steps,
  initialStep,
}: TransactionConfirmationProps) {
  const [step, setStep] = useState<(typeof steps)[number]>(
    initialStep || steps[0]
  );

  const handleStepChange = (step: number) => {
    const foundStep = steps.find((s) => s.id === step);
    if (foundStep) {
      setStep(foundStep);
    }
  };

  return (
    <ErrorBoundary fallback={<div>Error with transaction confirmation</div>}>
      <div className='container mx-auto p-4 space-y-4 max-w-3xl min-h-[80dvh]'>
        <FormStepper steps={steps} step={step.id} setStep={handleStepChange} />
        <Card
          className={getGlassyCardClassName('flex flex-col justify-center')}
        >
          <AnimatePresence>
            {step.name === 'KYC' && (
              <KycUploadStep
                onSuccess={() => setStep(steps.find((s) => s.name === 'SAFT')!)}
              />
            )}
            {step.name === 'SAFT' && (
              <SaftReviewStep
                onSuccess={() =>
                  setStep(steps.find((s) => s.name === 'Payment')!)
                }
              />
            )}
            {step.name === 'Payment' && (
              <PaymentAvailabilityGuard>
                <PaymentStep
                  onSuccess={() =>
                    setStep(steps.find((s) => s.name === 'Confirmation')!)
                  }
                />
              </PaymentAvailabilityGuard>
            )}
            {step.name === 'Confirmation' && <ConfirmationStep />}
          </AnimatePresence>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
