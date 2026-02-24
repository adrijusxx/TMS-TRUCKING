'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { getSettlementMetrics } from '@/lib/actions/hr';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

const periodLabels = {
  week: 'This Week',
  month: 'This Month',
  quarter: 'This Quarter',
} as const;

export function SettlementSummary() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['settlement-metrics', period],
    queryFn: () => getSettlementMetrics(period),
  });

  const metrics = data?.data || { avgWeekly: 0, totalThisMonth: 0, avgDeductions: 0, settlementCount: 0 };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Settlement Summary</CardTitle>
            <CardDescription>Driver settlement statistics ({periodLabels[period]})</CardDescription>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month' | 'quarter')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Average Weekly Settlement</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.avgWeekly)}</p>
              <p className="text-xs text-green-600">Based on {metrics.settlementCount} records</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Total Paid ({periodLabels[period]})</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.totalThisMonth)}</p>
              <p className="text-xs text-muted-foreground">{metrics.settlementCount} settlements</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Avg Deductions</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.avgDeductions)}</p>
              <p className="text-xs text-muted-foreground">Per settlement</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
