'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DollarSign, TrendingUp, TrendingDown, Users, AlertTriangle } from 'lucide-react';

interface CostItem {
  label: string;
  amount: number;
  count: number;
}

interface DriverCost {
  driverId: string;
  driverName: string;
  incidentCost: number;
  claimCost: number;
  citationCost: number;
  totalCost: number;
}

interface TrendPoint {
  month: string;
  value: number;
  count: number;
}

interface CostAnalyticsData {
  totalCost: number;
  incidentCosts: { total: number; items: CostItem[] };
  claimCosts: { total: number; items: CostItem[] };
  costPerDriver: DriverCost[];
  costTrends: TrendPoint[];
}

export default function SafetyCostAnalytics() {
  const [months, setMonths] = useState('12');

  const { data, isLoading } = useQuery({
    queryKey: ['safety-cost-analytics', months],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/safety/analytics/costs?months=${months}`));
      if (!res.ok) throw new Error('Failed to fetch cost analytics');
      const json = await res.json();
      return json.data as CostAnalyticsData;
    },
  });

  if (isLoading) {
    return <Card><CardContent className="p-6 text-center text-muted-foreground">Loading analytics...</CardContent></Card>;
  }

  if (!data) return null;

  const lastTwoMonths = data.costTrends.slice(-2);
  const trendDirection = lastTwoMonths.length === 2
    ? lastTwoMonths[1].value > lastTwoMonths[0].value ? 'up' : 'down'
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <Select value={months} onValueChange={setMonths}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Safety Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalCost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Incident Costs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.incidentCosts.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Claim Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.claimCosts.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Trend</CardTitle>
            {trendDirection === 'up' ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trendDirection === 'up' ? 'Increasing' : 'Decreasing'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Trends */}
      <Card>
        <CardHeader><CardTitle>Monthly Cost Trends</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {data.costTrends.map((t) => {
              const maxVal = Math.max(...data.costTrends.map((p) => p.value), 1);
              const height = (t.value / maxVal) * 100;
              return (
                <div key={t.month} className="flex-1 flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground mb-1">
                    {formatCurrency(t.value)}
                  </span>
                  <div
                    className="w-full bg-primary/80 rounded-t min-h-[2px]"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {t.month.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Cost Breakdown */}
        <Card>
          <CardHeader><CardTitle>Cost by Category</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[...data.incidentCosts.items, ...data.claimCosts.items]
              .sort((a, b) => b.amount - a.amount)
              .map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm">
                    {item.label.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.count}</Badge>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                </div>
              ))}
            {data.incidentCosts.items.length === 0 && data.claimCosts.items.length === 0 && (
              <p className="text-center text-muted-foreground">No cost data for this period</p>
            )}
          </CardContent>
        </Card>

        {/* Cost per Driver */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Cost per Driver (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.costPerDriver.slice(0, 10).map((d, idx) => (
              <div key={d.driverId} className="flex items-center justify-between">
                <span className="text-sm">
                  {idx + 1}. {d.driverName}
                </span>
                <span className="font-medium">{formatCurrency(d.totalCost)}</span>
              </div>
            ))}
            {data.costPerDriver.length === 0 && (
              <p className="text-center text-muted-foreground">No driver cost data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
