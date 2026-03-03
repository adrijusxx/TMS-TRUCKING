/**
 * Pay Estimator
 *
 * Shows the driver's estimated pay for the current settlement period.
 * Fetches completed and in-transit loads, calculates pay based on
 * the driver's pay type, and displays a detailed breakdown.
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  Truck,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { formatCurrency, apiUrl } from '@/lib/utils';

interface PayLoadBreakdown {
  loadNumber: string;
  status: string;
  miles: number;
  pay: number;
}

interface PayEstimate {
  payType: string; // PER_MILE | PER_LOAD | PERCENTAGE | HOURLY | WEEKLY
  payRate: number;
  weeklyMiles: number;
  completedLoadsPay: number;
  inTransitLoadsPay: number;
  totalEstimatedPay: number;
  completedLoads: PayLoadBreakdown[];
  inTransitLoads: PayLoadBreakdown[];
  periodStart: string;
  periodEnd: string;
}

const PAY_TYPE_LABELS: Record<string, string> = {
  PER_MILE: 'Per Mile',
  PER_LOAD: 'Per Load',
  PERCENTAGE: 'Percentage',
  HOURLY: 'Hourly',
  WEEKLY: 'Weekly',
};

function PayTypeUnit({ payType, payRate }: { payType: string; payRate: number }) {
  switch (payType) {
    case 'PER_MILE':
      return <span>{formatCurrency(payRate)}/mi</span>;
    case 'PER_LOAD':
      return <span>{formatCurrency(payRate)}/load</span>;
    case 'PERCENTAGE':
      return <span>{payRate}%</span>;
    case 'HOURLY':
      return <span>{formatCurrency(payRate)}/hr</span>;
    default:
      return <span>{formatCurrency(payRate)}</span>;
  }
}

function LoadBreakdownRow({ load }: { load: PayLoadBreakdown }) {
  const isCompleted = load.status === 'DELIVERED';
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div className="flex items-center gap-2">
        {isCompleted ? (
          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
        ) : (
          <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
        )}
        <div>
          <p className="text-sm font-medium">#{load.loadNumber}</p>
          {load.miles > 0 && (
            <p className="text-xs text-muted-foreground">{load.miles.toLocaleString()} mi</p>
          )}
        </div>
      </div>
      <span className="text-sm font-semibold">{formatCurrency(load.pay)}</span>
    </div>
  );
}

export default function PayEstimator() {
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading } = useQuery<PayEstimate>({
    queryKey: ['driver-pay-estimate'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/mobile/driver/pay-estimate'));
      if (!response.ok) {
        // Fallback: try the stats endpoint for basic data
        const statsRes = await fetch(apiUrl('/api/mobile/driver/stats'));
        if (!statsRes.ok) throw new Error('Failed to fetch pay data');
        const stats = await statsRes.json();
        return {
          payType: 'PER_MILE',
          payRate: 0,
          weeklyMiles: stats.data?.weeklyMiles || 0,
          completedLoadsPay: stats.data?.estimatedPay || 0,
          inTransitLoadsPay: 0,
          totalEstimatedPay: stats.data?.estimatedPay || 0,
          completedLoads: [],
          inTransitLoads: [],
          periodStart: new Date().toISOString(),
          periodEnd: new Date().toISOString(),
        } as PayEstimate;
      }
      const result = await response.json();
      return result.data as PayEstimate;
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-10 w-40 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const hasBreakdown = data.completedLoads.length > 0 || data.inTransitLoads.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Estimated Pay
          </CardTitle>
          {data.payType && (
            <Badge variant="secondary" className="text-xs">
              {PAY_TYPE_LABELS[data.payType] || data.payType}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Total Pay */}
        <div className="text-center py-2">
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(data.totalEstimatedPay)}
          </p>
          {data.payRate > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Rate: <PayTypeUnit payType={data.payType} payRate={data.payRate} />
            </p>
          )}
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
            <p className="text-lg font-bold text-green-700 dark:text-green-400">
              {formatCurrency(data.completedLoadsPay)}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.completedLoads.length} load{data.completedLoads.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Truck className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs text-muted-foreground">In Transit</span>
            </div>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
              {formatCurrency(data.inTransitLoadsPay)}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.inTransitLoads.length} load{data.inTransitLoads.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Miles & Rate */}
        {data.weeklyMiles > 0 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {data.weeklyMiles.toLocaleString()} miles this period
              </span>
            </div>
            {data.totalEstimatedPay > 0 && (
              <span className="text-xs font-medium">
                {formatCurrency(data.totalEstimatedPay / data.weeklyMiles)}/mi avg
              </span>
            )}
          </div>
        )}

        {/* Expandable Breakdown */}
        {hasBreakdown && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5 mr-1" />
                  Hide Breakdown
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5 mr-1" />
                  Show Breakdown
                </>
              )}
            </Button>

            {expanded && (
              <div className="mt-2 space-y-3">
                {data.completedLoads.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Completed Loads</p>
                    {data.completedLoads.map((load) => (
                      <LoadBreakdownRow key={load.loadNumber} load={load} />
                    ))}
                  </div>
                )}
                {data.inTransitLoads.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">In Transit (Est.)</p>
                    {data.inTransitLoads.map((load) => (
                      <LoadBreakdownRow key={load.loadNumber} load={load} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
