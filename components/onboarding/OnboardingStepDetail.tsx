'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, Download, Upload, ExternalLink, Lightbulb, Lock, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnboardingStep } from '@/lib/config/onboarding-steps';
import { downloadTemplate } from '@/lib/utils/csv-template-generator';
import ImportSheet from '@/components/import-export/ImportSheet';

interface DataQualityInfo {
  placeholders: number;
  total: number;
}

interface OnboardingStepDetailProps {
  step: OnboardingStep;
  isComplete: boolean;
  isLocked: boolean;
  lockedBySteps: string[];
  count: number;
  dataQuality?: DataQualityInfo;
  onRefresh: () => void;
}

export default function OnboardingStepDetail({
  step,
  isComplete,
  isLocked,
  lockedBySteps,
  count,
  dataQuality,
  onRefresh,
}: OnboardingStepDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl font-bold">{step.label}</h2>
          {isComplete && (
            <Badge variant="default" className="bg-green-600 text-xs gap-1">
              <CheckCircle2 className="h-3 w-3" /> Complete
            </Badge>
          )}
          {step.validation.minCount === 0 && !isComplete && (
            <Badge variant="outline" className="text-xs">Optional</Badge>
          )}
        </div>
        <p className="text-muted-foreground">{step.longDescription}</p>
      </div>

      {/* Locked state */}
      {isLocked && (
        <Card className="border-yellow-200 dark:border-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-500/5">
          <CardContent className="py-4 flex items-center gap-3">
            <Lock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
            <div>
              <p className="text-sm font-medium">Dependencies not met</p>
              <p className="text-xs text-muted-foreground">
                Complete these steps first: {lockedBySteps.join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      {step.tips.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                {step.tips.map((tip, i) => (
                  <p key={i} className="text-sm">{tip}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Required fields */}
      {step.templateFields.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Template Fields</h3>
          <div className="flex flex-wrap gap-1.5">
            {step.templateFields.map((field) => (
              <Badge key={field} variant="outline" className="text-xs font-mono">
                {field}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {step.importable && step.entityType && !isLocked && (
          <>
            <ImportSheet entityType={step.entityType} onImportComplete={() => onRefresh()}>
              <Button className="gap-2">
                <Upload className="h-4 w-4" />
                Import CSV / Excel
              </Button>
            </ImportSheet>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => downloadTemplate(step)}
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </>
        )}

        {step.manualPath && !isLocked && (
          <Button variant="outline" className="gap-2" asChild>
            <a href={step.manualPath}>
              <ExternalLink className="h-4 w-4" />
              Add Manually
            </a>
          </Button>
        )}

        {step.settingsPath && (
          <Button variant="outline" className="gap-2" asChild>
            <a href={step.settingsPath}>
              <ExternalLink className="h-4 w-4" />
              Open Settings
            </a>
          </Button>
        )}
      </div>

      {/* Status / data quality */}
      {count > 0 && (
        <Card className={cn(
          'border-green-200 dark:border-green-500/30',
          'bg-green-50/50 dark:bg-green-500/5'
        )}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">{count} records imported</span>
              </div>
              {dataQuality && dataQuality.placeholders > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {dataQuality.placeholders} with placeholder values
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!step.importable && step.id === 'company-settings' && (
        <Card className={cn(
          isComplete
            ? 'border-green-200 dark:border-green-500/30 bg-green-50/50 dark:bg-green-500/5'
            : 'border-yellow-200 dark:border-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-500/5'
        )}>
          <CardContent className="py-4 flex items-center gap-3">
            {isComplete ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Company settings configured</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium">
                  Update your company address in Settings to continue
                </span>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
