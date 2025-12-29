'use client';

/**
 * Rate Confirmation Processing Skeleton
 * 
 * Displays a skeleton loader while the AI extracts data from a Rate Con PDF.
 * Per OPERATIONAL_OVERHAUL spec: "UI immediately switches to Processing state"
 * 
 * @see docs/specs/OPERATIONAL_OVERHAUL.MD Section 1.1
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Sparkles, FileText, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RateConProcessingSkeletonProps {
  /** Current processing progress (0-100) */
  progress: number;
  /** Current status message */
  statusMessage: string;
  /** Optional filename being processed */
  fileName?: string;
  /** Completed extraction steps for visual feedback */
  completedSteps?: string[];
}

/**
 * Processing steps for visual feedback
 */
const PROCESSING_STEPS = [
  { id: 'upload', label: 'Uploading PDF', threshold: 10 },
  { id: 'extract', label: 'Extracting text from PDF', threshold: 25 },
  { id: 'analyze', label: 'AI analyzing document', threshold: 50 },
  { id: 'details', label: 'Extracting stops & details', threshold: 75 },
  { id: 'complete', label: 'Preparing draft for review', threshold: 100 },
];

export default function RateConProcessingSkeleton({
  progress,
  statusMessage,
  fileName,
  completedSteps = [],
}: RateConProcessingSkeletonProps) {
  return (
    <Card className="overflow-hidden">
      {/* Header with animated gradient */}
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full animate-ping" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Extracting Load Data</h3>
            <p className="text-sm text-muted-foreground">
              {statusMessage || 'Processing your rate confirmation...'}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* File info */}
        {fileName && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium truncate">{fileName}</span>
          </div>
        )}

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Processing</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Processing steps */}
        <div className="space-y-2">
          {PROCESSING_STEPS.map((step, index) => {
            const isComplete = progress >= step.threshold;
            const isActive = progress >= (PROCESSING_STEPS[index - 1]?.threshold ?? 0) && 
                            progress < step.threshold;
            
            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-md transition-all duration-300',
                  isComplete && 'bg-green-50 dark:bg-green-950/20',
                  isActive && 'bg-primary/5'
                )}
              >
                <div
                  className={cn(
                    'h-5 w-5 rounded-full flex items-center justify-center transition-all',
                    isComplete && 'bg-green-500 text-white',
                    isActive && 'bg-primary/20 animate-pulse',
                    !isComplete && !isActive && 'bg-muted'
                  )}
                >
                  {isComplete ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm',
                    isComplete && 'text-green-700 dark:text-green-400',
                    isActive && 'text-primary font-medium',
                    !isComplete && !isActive && 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
                {isActive && (
                  <div className="ml-auto flex gap-1">
                    <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" />
                    <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce delay-100" />
                    <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce delay-200" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Skeleton preview of what will be extracted */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>
          
          {/* Reference numbers skeleton */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>

          {/* Locations skeleton */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          {/* Financial skeleton */}
          <div className="flex justify-between items-center pt-2 border-t">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>

        {/* Tip */}
        <p className="text-xs text-center text-muted-foreground">
          You'll be able to review and edit all extracted data before saving
        </p>
      </CardContent>
    </Card>
  );
}

