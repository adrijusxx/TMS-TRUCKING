'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepperProps {
  steps: {
    label: string;
    description?: string;
  }[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  {/* Step Circle */}
                  <div
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                      isCompleted
                        ? 'bg-primary border-primary text-primary-foreground'
                        : isActive
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-background border-muted-foreground text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{stepNumber}</span>
                    )}
                  </div>
                  {/* Step Label */}
                  <div className="ml-3 flex-1">
                    <div
                      className={cn(
                        'text-sm font-medium',
                        isActive || isCompleted
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {step.label}
                    </div>
                    {step.description && (
                      <div
                        className={cn(
                          'text-xs mt-0.5',
                          isActive || isCompleted
                            ? 'text-muted-foreground'
                            : 'text-muted-foreground/70'
                        )}
                      >
                        {step.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-4 transition-colors',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

























