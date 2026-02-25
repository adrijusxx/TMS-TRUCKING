'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';

export interface WizardStep {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** If true, this step is skipped (e.g., pickup/delivery when multi-stop) */
  hidden?: boolean;
}

interface LoadFormWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  /** Whether all visible steps are valid */
  canProceed?: boolean;
  /** Whether the form is submitting */
  isSubmitting?: boolean;
  /** Called when user clicks "Create Load" on the last step */
  onSubmit?: () => void;
  children: React.ReactNode;
}

export function LoadFormWizard({
  steps,
  currentStep,
  onStepChange,
  canProceed = true,
  isSubmitting = false,
  onSubmit,
  children,
}: LoadFormWizardProps) {
  const visibleSteps = steps.filter((s) => !s.hidden);
  const visibleIndex = visibleSteps.findIndex((s) => s.id === steps[currentStep]?.id);
  const isFirstStep = visibleIndex <= 0;
  const isLastStep = visibleIndex >= visibleSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onSubmit?.();
      return;
    }
    // Find the next visible step index in the full steps array
    const currentId = visibleSteps[visibleIndex]?.id;
    const nextVisibleId = visibleSteps[visibleIndex + 1]?.id;
    if (nextVisibleId) {
      const fullIndex = steps.findIndex((s) => s.id === nextVisibleId);
      if (fullIndex >= 0) onStepChange(fullIndex);
    }
  };

  const handlePrev = () => {
    if (isFirstStep) return;
    const prevVisibleId = visibleSteps[visibleIndex - 1]?.id;
    if (prevVisibleId) {
      const fullIndex = steps.findIndex((s) => s.id === prevVisibleId);
      if (fullIndex >= 0) onStepChange(fullIndex);
    }
  };

  return (
    <div className="space-y-4">
      {/* Step Indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {visibleSteps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === visibleIndex;
          const isCompleted = idx < visibleIndex;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                const fullIdx = steps.findIndex((s) => s.id === step.id);
                if (fullIdx >= 0) onStepChange(fullIdx);
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                isActive && 'bg-primary text-primary-foreground',
                isCompleted && 'bg-primary/10 text-primary',
                !isActive && !isCompleted && 'text-muted-foreground hover:bg-muted'
              )}
            >
              {isCompleted ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <div>{children}</div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={isFirstStep}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="text-xs text-muted-foreground">
          Step {visibleIndex + 1} of {visibleSteps.length}
        </div>
        <Button
          type={isLastStep ? 'submit' : 'button'}
          size="sm"
          onClick={isLastStep ? undefined : handleNext}
          disabled={isSubmitting}
        >
          {isLastStep ? (
            isSubmitting ? 'Creating...' : 'Create Load'
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
