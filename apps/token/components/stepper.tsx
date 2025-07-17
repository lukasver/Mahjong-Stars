'use client';

import { cn } from '@mjs/ui/lib/utils';
import { Check } from 'lucide-react';
import {
  Stepper as _Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@mjs/ui/primitives/stepper';

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
}

export function Stepper({
  currentStep,
  steps,
  onStepClick,
  className,
}: StepperProps) {
  return (
    <div className={cn('w-full py-6', className)}>
      <div className='flex items-center justify-between px-4 py-2'>
        {steps.map((step, index) => (
          <div key={step.id} className='flex not-last:flex-1 items-center'>
            <div className='flex flex-col items-center'>
              <button
                type='button'
                onClick={() => onStepClick?.(step.id)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                  currentStep > step.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : currentStep === step.id
                    ? 'border-secondary-500 bg-background text-secondary-500'
                    : 'border-muted-foreground/25 bg-background text-muted-foreground',
                  onStepClick && 'hover:border-primary/50 cursor-pointer'
                )}
              >
                {currentStep > step.id ? (
                  <Check className='h-5 w-5' />
                ) : (
                  step.id
                )}
              </button>
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
                <div className='text-xs text-muted-foreground hidden sm:block whitespace-nowrap'>
                  {step.description}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className='flex-1 mx-4 sm:mx-8 min-w-[60px] sm:min-w-[100px]'>
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

export const Stepper2 = ({
  currentStep,
  steps,
  onStepClick,
  className,
}: StepperProps) => {
  return (
    <_Stepper
      value={currentStep}
      onValueChange={onStepClick}
      className={className}
    >
      {steps.map((step) => (
        <StepperItem key={step.id} step={step.id} className='not-last:flex-1'>
          <StepperTrigger className='flex-col gap-3 rounded'>
            <StepperIndicator />
            <div className='space-y-0.5 px-2'>
              <StepperTitle>{step.name}</StepperTitle>
              <StepperDescription className='max-sm:hidden'>
                {step.description}
              </StepperDescription>
            </div>
          </StepperTrigger>
          {step.id < steps.length && (
            <StepperSeparator className='absolute inset-x-0 top-3 left-[calc(50%+0.75rem+0.125rem)] -order-1 m-0 -translate-y-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none' />
          )}
        </StepperItem>
      ))}
    </_Stepper>
  );
};
