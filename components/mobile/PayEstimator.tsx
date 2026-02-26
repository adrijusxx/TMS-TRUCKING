'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, Truck } from 'lucide-react';
import { formatCurrency, apiUrl } from '@/lib/utils';

interface DriverStats {
  weeklyMiles: number;
  estimatedPay: number;
  safetyScore: number;
  activeBreakdowns: number;
}

export default function PayEstimator() {
  const { data, isLoading } = useQuery({
    queryKey: ['driver-stats'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/mobile/driver/stats'));
      if (!response.ok) throw new Error('Failed to fetch stats');
      const result = await response.json();
      return result.data as DriverStats;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-8 w-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground font-medium">Est. Pay This Week</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(data.estimatedPay)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Truck className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground font-medium">Miles This Week</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {data.weeklyMiles.toLocaleString()}
            </p>
          </div>
        </div>
        {data.estimatedPay > 0 && data.weeklyMiles > 0 && (
          <div className="mt-3 pt-3 border-t flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatCurrency(data.estimatedPay / data.weeklyMiles)}/mile avg
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
