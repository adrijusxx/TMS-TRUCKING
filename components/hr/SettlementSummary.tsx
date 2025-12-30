'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useQuery } from '@tanstack/react-query';
import { getSettlementMetrics } from '@/lib/actions/hr';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

export function SettlementSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ['settlement-metrics'],
    queryFn: () => getSettlementMetrics(),
  });

  const metrics = data?.data || { avgWeekly: 0, totalThisMonth: 0, avgDeductions: 0, settlementCount: 0 };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settlement Summary</CardTitle>
        <CardDescription>Driver settlement statistics (Current Month)</CardDescription>
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
              <p className="text-sm text-muted-foreground mb-2">Total Paid This Month</p>
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





