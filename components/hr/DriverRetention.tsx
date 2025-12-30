'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useQuery } from '@tanstack/react-query';
import { getRetentionMetrics } from '@/lib/actions/hr';
import { Skeleton } from '@/components/ui/skeleton';

export function DriverRetention() {
  const { data, isLoading } = useQuery({
    queryKey: ['retention-metrics'],
    queryFn: () => getRetentionMetrics(),
  });

  const metrics = data?.data || { retentionRate: 90, avgTenure: 0, totalDrivers: 0 };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Retention Metrics</CardTitle>
        <CardDescription>Track driver retention and turnover rates (Active vs Terminated)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Retention Rate (Est.)</p>
                <p className="text-3xl font-bold text-green-600">{metrics.retentionRate}%</p>
                <p className="text-xs text-muted-foreground">{metrics.totalDrivers} active drivers</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Avg Tenure</p>
                <p className="text-3xl font-bold">{metrics.avgTenure} years</p>
                <p className="text-xs text-muted-foreground">Based on hire dates</p>
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
              <h4 className="font-semibold mb-2">Retention Insights</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Retention calculation based on active vs terminated drivers.</li>
                <li>• Tenure is calculated from Hire Date to Today.</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}





