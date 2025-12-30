'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency, apiUrl } from '@/lib/utils';
import { CHART_COLORS } from '@/lib/theme/chart-theme';
import { LoadingState } from '@/components/ui/loading-state';
import common from '@/lib/content/common.json';

interface RevenueData {
  month: string;
  revenue: number;
  loads: number;
}

async function fetchRevenueTrends() {
  const response = await fetch(apiUrl('/api/dashboard/revenue-trends'));
  if (!response.ok) throw new Error('Failed to fetch revenue trends');
  return response.json();
}

export default function RevenueTrends() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['revenue-trends'],
    queryFn: fetchRevenueTrends,
    retry: 2,
    staleTime: 60000, // Cache for 1 minute
  });

  const revenueData: RevenueData[] = data?.data || [];
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const avgRevenue = revenueData.length > 0 ? totalRevenue / revenueData.length : 0;
  const lastMonth = revenueData[revenueData.length - 1];
  const previousMonth = revenueData[revenueData.length - 2];
  const growth = lastMonth && previousMonth
    ? ((lastMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Trends
            </CardTitle>
            <CardDescription>Monthly revenue and load count</CardDescription>
          </div>
          {growth !== 0 && (
            <div className={`flex items-center gap-1 ${growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState message="Loading revenue data..." className="py-8" />
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-destructive mb-2">
              {common.states.error}
            </p>
            <p className="text-xs text-muted-foreground">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        ) : revenueData.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {common.states.empty}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Monthly</p>
                <p className="text-2xl font-bold">{formatCurrency(avgRevenue)}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  yAxisId="revenue"
                  orientation="left"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="loads"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue') {
                      return [formatCurrency(value), 'Revenue'];
                    }
                    return [value, 'Loads'];
                  }}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.status.assigned}
                  strokeWidth={2}
                  name="Revenue"
                  dot={{ r: 4 }}
                />
                <Line
                  yAxisId="loads"
                  type="monotone"
                  dataKey="loads"
                  stroke={CHART_COLORS.status.success}
                  strokeWidth={2}
                  name="Loads"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

