'use client';

import { Stepper } from '@/components/stepper';
import ErrorBoundary from '@mjs/ui/components/error-boundary';
import { AnimatePresence } from '@mjs/ui/components/motion';
import { Card } from '@mjs/ui/primitives/card';
import { useState } from 'react';

export function TransactionConfirmation({
  steps,
  initialStep = 1,
}: {
  steps: { id: number; name: string; description: string }[];
  initialStep: number;
}) {
  const [step, setStep] = useState(initialStep);
  return (
    <ErrorBoundary fallback={<div>Error with transaction confirmation</div>}>
      <div className='container mx-auto p-4'>
        <FormStepper steps={steps} step={step} setStep={setStep} />
        <AnimatePresence>
          {step === 1 && <KycUploadDocument />}
          {step === 2 && <div>SAFT</div>}
          {step === 3 && <div>Payment</div>}
          {step === 4 && <div>Confirmation</div>}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

const KycUploadDocument = () => {
  return <div>KycUploadDocument</div>;
};

const FormStepper = ({
  className,
  steps,
  step,
  setStep,
}: {
  className?: string;
  steps: { id: number; name: string; description: string }[];
  step: number;
  setStep: (step: number) => void;
}) => {
  return (
    <Card className='px-4'>
      <Stepper
        currentStep={step}
        steps={steps}
        className={className}
        onStepClick={setStep}
      />
    </Card>
  );
};
