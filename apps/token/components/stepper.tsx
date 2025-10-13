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
    <div
      className={cn(
        'w-full py-4 sm:py-6 max-w-[350px] scrollbar-hidden sm:max-w-none',
        className
      )}
    >
      <div className='flex items-center justify-between px-2 sm:px-4 py-2'>
        {steps.map((step, index) => (
          <div key={step.id} className='flex not-last:flex-1 items-center'>
            <div className='flex flex-col items-center'>
              <BtnEl
                type='button'
                role={!disableClick ? 'button' : undefined}
                onClick={() => !disableClick && onStepClick?.(step.id)}
                className={cn(
                  'flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 text-xs sm:text-sm font-medium transition-colors',
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
                  <Check className='h-4 w-4 sm:h-5 sm:w-5' />
                ) : (
                  step.id
                )}
              </BtnEl>
              <div className='mt-1 sm:mt-2 text-center'>
                <div
                  className={cn(
                    'text-xs font-medium whitespace-nowrap max-w-[65px] truncate md:max-w-[125px]',
                    currentStep >= step.id
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {step.name}
                </div>
                <div className='text-xs text-secondary hidden lg:block whitespace-nowrap overflow-scroll scrollbar-hidden max-w-[65px] truncate md:max-w-[125px]'>
                  {step.description}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className='flex-1 mx-2 sm:mx-4 lg:mx-8 min-w-[20px] sm:min-w-[40px] lg:min-w-[60px]'>
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
