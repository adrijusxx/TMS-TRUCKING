'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Truck,
  Container,
  Building2,
  Package,
  CheckCircle2,
  Circle,
  X,
  Upload,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EntityCounts {
  drivers: number;
  trucks: number;
  trailers: number;
  customers: number;
  loads: number;
}

interface OnboardingData {
  dismissed: boolean;
  counts: EntityCounts;
}

const IMPORT_STEPS = [
  {
    key: 'drivers' as const,
    label: 'Drivers',
    description: 'Import your driver roster with pay rates, CDL info, and contact details.',
    icon: Users,
    href: '/dashboard/import/drivers',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-500/10',
  },
  {
    key: 'trucks' as const,
    label: 'Trucks',
    description: 'Import your fleet with VIN, year, make, model, and plate info.',
    icon: Truck,
    href: '/dashboard/import/trucks',
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-500/10',
  },
  {
    key: 'trailers' as const,
    label: 'Trailers',
    description: 'Import trailer inventory with type, dimensions, and plate numbers.',
    icon: Container,
    href: '/dashboard/import/trailers',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-500/10',
  },
  {
    key: 'customers' as const,
    label: 'Customers',
    description: 'Import customer/broker list with billing addresses and payment terms.',
    icon: Building2,
    href: '/dashboard/import/customers',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-500/10',
  },
  {
    key: 'loads' as const,
    label: 'Loads',
    description: 'Import historical or active loads. Best done after drivers and customers.',
    icon: Package,
    href: '/dashboard/import/loads',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-500/10',
  },
];

export default function OnboardingGuide() {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [dismissing, setDismissing] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    fetch('/api/onboarding')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch((err) => console.error('[OnboardingGuide] fetch failed:', err));
  }, []);

  if (!data || data.dismissed || hidden) return null;

  const completedSteps = IMPORT_STEPS.filter((s) => data.counts[s.key] > 0).length;
  const progress = Math.round((completedSteps / IMPORT_STEPS.length) * 100);
  const allDone = completedSteps === IMPORT_STEPS.length;

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await fetch('/api/onboarding', { method: 'POST' });
      setHidden(true);
    } catch {
      setDismissing(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-background to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Getting Started — Import Your Data</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Follow this order for the best experience. Each step builds on the previous one.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
            disabled={dismissing}
            title="Dismiss forever"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedSteps} of {IMPORT_STEPS.length} categories imported
            </span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {IMPORT_STEPS.map((step, idx) => {
            const done = data.counts[step.key] > 0;
            const Icon = step.icon;
            return (
              <div
                key={step.key}
                className={cn(
                  'relative rounded-lg border p-3 transition-colors',
                  done
                    ? 'border-green-200 bg-green-50/50 dark:border-green-500/30 dark:bg-green-500/5'
                    : 'border-border hover:border-primary/40 hover:bg-primary/5'
                )}
              >
                {/* Step number */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    {idx + 1}
                  </span>
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn('h-4 w-4', done ? 'text-green-500' : step.color)} />
                  <span className="font-medium text-sm">{step.label}</span>
                </div>

                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {step.description}
                </p>

                {done ? (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    {data.counts[step.key]} imported
                  </span>
                ) : (
                  <Link href={step.href}>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 w-full">
                      <Upload className="h-3 w-3" />
                      Import
                    </Button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Tip + dismiss action */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> You can also add records manually from each section. CSV and Excel files are supported for import.
          </p>
          {allDone ? (
            <Button size="sm" onClick={handleDismiss} disabled={dismissing} className="gap-1.5">
              All done — Dismiss guide
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              disabled={dismissing}
              className="text-muted-foreground text-xs"
            >
              Skip — I&apos;ll figure it out
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
