'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, DollarSign, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

async function fetchHRMetrics() {
  try {
    const response = await fetch(apiUrl('/api/hr/dashboard/metrics'), {
      credentials: 'include',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Failed to fetch HR metrics: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch HR metrics');
    }
    return result.data;
  } catch (error) {
    console.error('HR metrics fetch error:', error);
    throw error;
  }
}

export function HRDashboardMetrics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['hr-dashboard-metrics'],
    queryFn: fetchHRMetrics,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (error) {
    console.error('Error loading HR metrics:', error);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Active Drivers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : error ? (
            <div className="text-2xl font-bold">--</div>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {data?.activeDrivers?.count ?? 0}
              </div>
              <p
                className={`text-xs ${
                  (data?.activeDrivers?.change ?? 0) >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {data?.activeDrivers?.changeLabel ?? '--'}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Avg Settlement */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Settlement</CardTitle>
          <DollarSign className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : error ? (
            <div className="text-2xl font-bold">--</div>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {formatCurrency(data?.avgSettlement?.amount ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {data?.avgSettlement?.period ?? 'Per week'}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Retention Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : error ? (
            <div className="text-2xl font-bold">--</div>
          ) : (
            <>
              <div className="text-2xl font-bold text-green-600">
                {data?.retentionRate?.percentage?.toFixed(0) ?? 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {data?.retentionRate?.period ?? 'Last 12 months'}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Bonuses Paid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bonuses Paid</CardTitle>
          <Award className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : error ? (
            <div className="text-2xl font-bold">--</div>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {formatCurrency(data?.bonusesPaid?.amount ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {data?.bonusesPaid?.period ?? 'This month'}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

