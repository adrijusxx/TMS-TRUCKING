'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, apiUrl } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Badge } from '@/components/ui/badge';

async function fetchRevenueForecast(months: number, forecastMonths: number) {
  const response = await fetch(
    apiUrl(`/api/analytics/revenue-forecast?months=${months}&forecastMonths=${forecastMonths}`)
  );
  if (!response.ok) throw new Error('Failed to fetch revenue forecast');
  return response.json();
}

export default function RevenueForecast() {
  const [historicalMonths, setHistoricalMonths] = useState(6);
  const [forecastMonths, setForecastMonths] = useState(3);

  const { data, isLoading } = useQuery({
    queryKey: ['revenue-forecast', historicalMonths, forecastMonths],
    queryFn: () => fetchRevenueForecast(historicalMonths, forecastMonths),
  });

  const historical = data?.data?.historical || [];
  const forecast = data?.data?.forecast || [];
  const metrics = data?.data?.metrics;

  // Combine historical and forecast for chart
  const chartData = [
    ...historical.map((d: any) => ({
      month: format(new Date(d.month + '-01'), 'MMM yyyy'),
      revenue: d.revenue,
      type: 'Historical',
    })),
    ...forecast.map((d: any) => ({
      month: format(new Date(d.month + '-01'), 'MMM yyyy'),
      revenue: d.revenue,
      type: 'Forecast',
      confidence: d.confidence,
    })),
  ];

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="historicalMonths">Historical Months</Label>
              <Input
                id="historicalMonths"
                type="number"
                min="3"
                max="24"
                value={historicalMonths}
                onChange={(e) => setHistoricalMonths(parseInt(e.target.value) || 6)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="forecastMonths">Forecast Months</Label>
              <Input
                id="forecastMonths"
                type="number"
                min="1"
                max="12"
                value={forecastMonths}
                onChange={(e) => setForecastMonths(parseInt(e.target.value) || 3)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.averageMonthlyRevenue)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              {metrics.growthRate >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  metrics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {metrics.growthRate >= 0 ? '+' : ''}
                {metrics.growthRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Historical</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.totalHistoricalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.monthsAnalyzed} months
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projected Next 3 Months</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(
                  forecast.slice(0, 3).reduce((sum: number, f: any) => sum + f.revenue, 0)
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Forecast</CardTitle>
            <CardDescription>Historical data and projected revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => label}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Revenue"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Forecast Table */}
      {forecast.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Forecast</CardTitle>
            <CardDescription>Projected revenue by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Month</th>
                    <th className="text-right p-3 font-medium">Projected Revenue</th>
                    <th className="text-right p-3 font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.map((item: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="p-3 font-medium">
                        {format(new Date(item.month + '-01'), 'MMMM yyyy')}
                      </td>
                      <td className="p-3 text-right font-bold text-blue-600">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="p-3 text-right">
                        <Badge variant="outline" className={getConfidenceColor(item.confidence)}>
                          {item.confidence.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="text-center py-8">Loading revenue forecast...</div>
      )}

      {!isLoading && historical.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Not enough historical data to generate forecast. Need at least 3 months of data.
        </div>
      )}
    </div>
  );
}

