'use client';

import {
  Users, Truck, Container, Building2, Package, Settings, UserCog,
  CheckCircle2, Circle, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ONBOARDING_STEPS, type OnboardingStep } from '@/lib/config/onboarding-steps';

const STEP_ICONS: Record<string, typeof Users> = {
  Settings, UserCog, Users, Truck, Container, Building2, Package,
};

interface OnboardingStepListProps {
  activeStepId: string;
  onStepClick: (stepId: string) => void;
  isStepComplete: (stepId: string) => boolean;
  isStepLocked: (stepId: string) => boolean;
  counts: Record<string, number>;
}

export default function OnboardingStepList({
  activeStepId,
  onStepClick,
  isStepComplete,
  isStepLocked,
  counts,
}: OnboardingStepListProps) {
  return (
    <nav className="space-y-1">
      {ONBOARDING_STEPS.map((step) => {
        const complete = isStepComplete(step.id);
        const locked = isStepLocked(step.id);
        const active = activeStepId === step.id;
        const Icon = STEP_ICONS[step.icon] ?? Circle;
        const count = step.entityType ? (counts[step.entityType] ?? 0) : null;

        return (
          <button
            key={step.id}
            onClick={() => onStepClick(step.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
              active
                ? 'bg-primary/10 border border-primary/20'
                : 'hover:bg-muted/50',
              locked && 'opacity-50'
            )}
          >
            {/* Status indicator */}
            <div className="shrink-0">
              {complete ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : locked ? (
                <Lock className="h-4 w-4 text-muted-foreground" />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-xs font-bold text-muted-foreground">
                  {step.order + 1}
                </span>
              )}
            </div>

            {/* Step info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4 shrink-0', complete ? 'text-green-500' : 'text-muted-foreground')} />
                <span className={cn('text-sm font-medium truncate', active && 'text-primary')}>
                  {step.label}
                </span>
              </div>
              {count !== null && count > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5 ml-6">
                  {count} imported
                </p>
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );
}
