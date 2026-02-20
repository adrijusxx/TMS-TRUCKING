'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { FleetUtilizationPeriod } from '@/lib/managers/fleet-monitoring/types';

interface Props {
  data: FleetUtilizationPeriod[];
  loading: boolean;
  period: 'daily' | 'weekly';
}

export default function FleetUtilizationChart({ data, loading, period }: Props) {
  const chartData = data.map((d) => ({
    period: period === 'daily' ? d.period.slice(5) : d.period.split(' - ').map((s) => s.slice(5)).join('-'),
    Trucks: d.truckUtilizationRate,
    Trailers: d.trailerUtilizationRate,
    Drivers: d.driverUtilizationRate,
  }));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Utilization Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading chart...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          Utilization Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No data available for this period.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(value: number) => [`${value}%`]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Trucks"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Trailers"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Drivers"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
