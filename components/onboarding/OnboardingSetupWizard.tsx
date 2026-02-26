'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, ArrowRight, CheckCircle2, X, Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ONBOARDING_STEPS,
  getOnboardingStep,
  areStepDependenciesMet,
} from '@/lib/config/onboarding-steps';
import OnboardingStepList from './OnboardingStepList';
import OnboardingStepDetail from './OnboardingStepDetail';

interface OnboardingApiResponse {
  success: boolean;
  data: {
    dismissed: boolean;
    counts: Record<string, number>;
    companySettingsValid: boolean;
    dataQuality: Record<string, { placeholders: number; total: number }>;
  };
}

export default function OnboardingSetupWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeStepId, setActiveStepId] = useState(ONBOARDING_STEPS[0].id);

  const { data, refetch } = useQuery<OnboardingApiResponse>({
    queryKey: ['onboarding-status'],
    queryFn: () => fetch('/api/onboarding').then((r) => r.json()),
    refetchInterval: 10000,
  });

  const counts = data?.data?.counts ?? {};
  const companySettingsValid = data?.data?.companySettingsValid ?? false;
  const dataQuality = data?.data?.dataQuality ?? {};

  const isStepComplete = useCallback(
    (stepId: string) => {
      if (stepId === 'company-settings') return companySettingsValid;
      const step = getOnboardingStep(stepId);
      if (!step?.entityType) return false;
      const count = counts[step.entityType] ?? 0;
      const minCount = step.validation.minCount ?? 0;
      return minCount === 0 ? count > 0 : count >= minCount;
    },
    [counts, companySettingsValid]
  );

  const isStepLocked = useCallback(
    (stepId: string) =>
      !areStepDependenciesMet(stepId, counts, companySettingsValid),
    [counts, companySettingsValid]
  );

  const getLockedBySteps = useCallback(
    (stepId: string): string[] => {
      const step = getOnboardingStep(stepId);
      if (!step) return [];
      return step.dependencies
        .filter((depId) => !isStepComplete(depId))
        .map((depId) => getOnboardingStep(depId)?.label ?? depId);
    },
    [isStepComplete]
  );

  const completedCount = useMemo(
    () => ONBOARDING_STEPS.filter((s) => isStepComplete(s.id)).length,
    [isStepComplete]
  );
  const progress = Math.round((completedCount / ONBOARDING_STEPS.length) * 100);
  const allDone = completedCount === ONBOARDING_STEPS.length;

  const currentStep = getOnboardingStep(activeStepId) ?? ONBOARDING_STEPS[0];
  const currentIdx = ONBOARDING_STEPS.findIndex((s) => s.id === activeStepId);

  const goNext = () => {
    if (currentIdx < ONBOARDING_STEPS.length - 1) {
      setActiveStepId(ONBOARDING_STEPS[currentIdx + 1].id);
    }
  };

  const goPrev = () => {
    if (currentIdx > 0) {
      setActiveStepId(ONBOARDING_STEPS[currentIdx - 1].id);
    }
  };

  const handleDismiss = async () => {
    await fetch('/api/onboarding', { method: 'POST' });
    queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
    router.push('/dashboard');
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left sidebar */}
      <div className="w-72 shrink-0 border-r bg-muted/30 p-4 overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Setup Guide</h1>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {completedCount} of {ONBOARDING_STEPS.length} steps
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <OnboardingStepList
          activeStepId={activeStepId}
          onStepClick={setActiveStepId}
          isStepComplete={isStepComplete}
          isStepLocked={isStepLocked}
          counts={counts}
        />

        <div className="mt-6 pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={handleDismiss}
          >
            <X className="h-3 w-3 mr-1" />
            Skip — I&apos;ll figure it out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6">
          <OnboardingStepDetail
            step={currentStep}
            isComplete={isStepComplete(currentStep.id)}
            isLocked={isStepLocked(currentStep.id)}
            lockedBySteps={getLockedBySteps(currentStep.id)}
            count={currentStep.entityType ? (counts[currentStep.entityType] ?? 0) : 0}
            dataQuality={
              currentStep.entityType ? dataQuality[currentStep.entityType] : undefined
            }
            onRefresh={handleRefresh}
          />

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={currentIdx === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-3">
              {allDone && (
                <Button onClick={handleDismiss} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Complete Setup
                </Button>
              )}
              {!allDone && currentIdx < ONBOARDING_STEPS.length - 1 && (
                <Button onClick={goNext} className="gap-2">
                  {isStepComplete(currentStep.id) ? 'Next' : 'Skip'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
