'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Package } from 'lucide-react';
import { LoadStatus } from '@prisma/client';
import { apiUrl } from '@/lib/utils';

interface StatusData {
  status: LoadStatus;
  count: number;
  percentage: number;
}

const statusColors: Record<LoadStatus, string> = {
  PENDING: '#eab308',
  ASSIGNED: '#3b82f6',
  EN_ROUTE_PICKUP: '#a855f7',
  AT_PICKUP: '#f97316',
  LOADED: '#6366f1',
  EN_ROUTE_DELIVERY: '#06b6d4',
  AT_DELIVERY: '#ec4899',
  DELIVERED: '#10b981',
  BILLING_HOLD: '#f59e0b',
  READY_TO_BILL: '#22c55e',
  INVOICED: '#059669',
  PAID: '#14b8a6',
  CANCELLED: '#ef4444',
};

const statusLabels: Record<LoadStatus, string> = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  EN_ROUTE_PICKUP: 'En Route Pickup',
  AT_PICKUP: 'At Pickup',
  LOADED: 'Loaded',
  EN_ROUTE_DELIVERY: 'En Route Delivery',
  AT_DELIVERY: 'At Delivery',
  DELIVERED: 'Delivered',
  BILLING_HOLD: 'Billing Hold',
  READY_TO_BILL: 'Ready to Bill',
  INVOICED: 'Invoiced',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

async function fetchLoadStatusDistribution() {
  const response = await fetch(apiUrl('/api/dashboard/load-status-distribution'));
  if (!response.ok) throw new Error('Failed to fetch load status distribution');
  return response.json();
}

export default function LoadStatusDistribution() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['load-status-distribution'],
    queryFn: fetchLoadStatusDistribution,
    retry: 2,
    staleTime: 60000, // Cache for 1 minute
  });

  const statusData: StatusData[] = data?.data || [];
  const totalLoads = statusData.reduce((sum, item) => sum + item.count, 0);

  const chartData = statusData.map((item) => ({
    name: statusLabels[item.status],
    value: item.count,
    percentage: item.percentage,
    color: statusColors[item.status],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Load Status Distribution
        </CardTitle>
        <CardDescription>Current load status breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Loading status data...
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-destructive mb-2">
              Failed to load load status distribution
            </p>
            <p className="text-xs text-muted-foreground">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        ) : statusData.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No load data available
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{totalLoads}</p>
              <p className="text-sm text-muted-foreground">Total Active Loads</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, payload }: any) => `${name}: ${payload?.percentage?.toFixed(1) || 0}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    `${value} loads (${props.payload.percentage.toFixed(1)}%)`,
                    props.payload.name,
                  ]}
                />
                <Legend
                  formatter={(value, entry: any) => (
                    <span style={{ color: entry.color }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {statusData.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center gap-2 p-2 rounded border"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: statusColors[item.status] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{statusLabels[item.status]}</p>
                    <p className="text-muted-foreground">
                      {item.count} ({item.percentage.toFixed(1)}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

