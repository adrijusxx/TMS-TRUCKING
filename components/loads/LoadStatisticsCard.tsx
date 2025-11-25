'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, MapPin, DollarSign, Truck } from 'lucide-react';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface LoadStatistics {
  totalLoads: number;
  totalMiles: number;
  loadedMiles: number;
  emptyMiles: number;
  totalRevenue: number;
  totalDriverPay: number;
  totalProfit: number;
  averageMilesPerLoad: number;
  averageRevenuePerLoad: number;
  averageProfitPerLoad: number;
  utilizationRate: number; // Percentage of loaded miles vs total miles
}

async function fetchLoadStatistics(): Promise<LoadStatistics> {
  const response = await fetch(apiUrl('/api/loads/statistics'));
  if (!response.ok) throw new Error('Failed to fetch load statistics');
  const result = await response.json();
  return result.data;
}

export default function LoadStatisticsCard() {
  const { data: statistics, isLoading, error } = useQuery({
    queryKey: ['load-statistics'],
    queryFn: fetchLoadStatistics,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Load Statistics</CardTitle>
          <CardDescription>Key metrics for your loads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !statistics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Load Statistics</CardTitle>
          <CardDescription>Key metrics for your loads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">
            Failed to load statistics
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = statistics as LoadStatistics;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Load Statistics</CardTitle>
        <CardDescription>Key metrics for your loads</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Loads */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>Total Loads</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalLoads.toLocaleString()}</div>
          </div>

          {/* Total Miles */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Total Miles</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalMiles.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {stats.loadedMiles.toLocaleString()} loaded / {stats.emptyMiles.toLocaleString()} empty
            </div>
          </div>

          {/* Total Revenue */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Total Revenue</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <div className="text-xs text-muted-foreground">
              Avg: {formatCurrency(stats.averageRevenuePerLoad)}/load
            </div>
          </div>

          {/* Total Profit */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Total Profit</span>
            </div>
            <div className={cn(
              "text-2xl font-bold",
              stats.totalProfit >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(stats.totalProfit)}
            </div>
            <div className="text-xs text-muted-foreground">
              Avg: {formatCurrency(stats.averageProfitPerLoad)}/load
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="mt-6 pt-6 border-t grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Average Miles/Load</div>
            <div className="text-lg font-semibold">{stats.averageMilesPerLoad.toLocaleString()}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Utilization Rate</div>
            <div className="text-lg font-semibold">{stats.utilizationRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Loaded miles / Total miles</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Total Driver Pay</div>
            <div className="text-lg font-semibold">{formatCurrency(stats.totalDriverPay)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

