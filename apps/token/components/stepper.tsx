'use client';

import { cn } from '@mjs/ui/lib/utils';
import { Check } from 'lucide-react';

type Step = {
  id: number;
  name: string;
  description?: string;
};

interface StepperProps {
  currentStep: number;
  steps: Step[];
  onStepClick?: (step: number) => void;
  className?: string;
  disableClick?: boolean;
}

export function Stepper({
  currentStep,
  steps,
  onStepClick,
  className,
  disableClick = false,
}: StepperProps) {
  const BtnEl = disableClick ? 'div' : 'button';
  return (
    <div className={cn('w-full py-6', className)}>
      <div className='flex items-center justify-between px-4 py-2'>
        {steps.map((step, index) => (
          <div key={step.id} className='flex not-last:flex-1 items-center'>
            <div className='flex flex-col items-center'>
              <BtnEl
                type='button'
                role={!disableClick ? 'button' : undefined}
                onClick={() => !disableClick && onStepClick?.(step.id)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                  currentStep > step.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : currentStep === step.id
                      ? 'border-secondary-500 bg-background text-secondary-500'
                      : 'border-muted-foreground/25 bg-background text-muted-foreground',
                  onStepClick &&
                    !disableClick &&
                    'hover:border-primary/50 cursor-pointer'
                )}
              >
                {currentStep > step.id ? (
                  <Check className='h-5 w-5' />
                ) : (
                  step.id
                )}
              </BtnEl>
              <div className='mt-2 text-center'>
                <div
                  className={cn(
                    'text-xs sm:text-sm font-medium whitespace-nowrap',
                    currentStep >= step.id
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {step.name}
                </div>
                <div className='text-xs text-secondary hidden sm:block whitespace-nowrap'>
                  {step.description}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className='flex-1 mx-4 sm:mx-8 min-w-[60px]'>
                <div
                  className={cn(
                    'h-0.5 w-full transition-colors',
                    currentStep > step.id
                      ? 'bg-secondary-500'
                      : 'bg-muted-foreground/25'
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
