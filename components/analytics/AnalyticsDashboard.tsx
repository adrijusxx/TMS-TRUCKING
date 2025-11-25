'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, apiUrl } from '@/lib/utils';
import {
  DollarSign,
  Package,
  Truck,
  Users,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

async function fetchDashboardStats() {
  const response = await fetch(apiUrl('/api/analytics/dashboard'));
  if (!response.ok) throw new Error('Failed to fetch dashboard stats');
  return response.json();
}

async function fetchRevenueReport(startDate: string, endDate: string) {
  const response = await fetch(
    apiUrl(`/api/analytics/revenue?startDate=${startDate}&endDate=${endDate}&groupBy=day`)
  );
  if (!response.ok) throw new Error('Failed to fetch revenue report');
  return response.json();
}

export default function AnalyticsDashboard() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent excessive refetching
  });

  // Memoize dates to prevent recalculation on every render
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Use date strings (YYYY-MM-DD) for stable query keys
    const start = thirtyDaysAgo.toISOString().split('T')[0];
    const end = today.toISOString().split('T')[0];
    
    return { startDate: start, endDate: end };
  }, []); // Empty deps - only calculate once on mount

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-report', startDate, endDate],
    queryFn: () => fetchRevenueReport(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent excessive refetching
  });

  const stats = statsData?.data;
  const revenue = revenueData?.data;

  if (statsLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/analytics/profitability">
            <Button variant="outline">
              Profitability
            </Button>
          </Link>
          <Link href="/dashboard/analytics/drivers">
            <Button variant="outline">
              Driver Performance
            </Button>
          </Link>
          <Link href="/dashboard/analytics/fuel">
            <Button variant="outline">
              Fuel Analysis
            </Button>
          </Link>
          <Link href="/dashboard/analytics/empty-miles">
            <Button variant="outline">
              Empty Miles
            </Button>
          </Link>
          <Link href="/dashboard/analytics/revenue-forecast">
            <Button variant="outline">
              Revenue Forecast
            </Button>
          </Link>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.revenue?.today || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.revenue?.thisWeek || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.revenue?.thisMonth || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stats?.revenue?.percentChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span
                className={
                  stats?.revenue?.percentChange >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              >
                {Math.abs(stats?.revenue?.percentChange || 0).toFixed(1)}% vs last
                month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.revenue?.lastMonth || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
            <CardDescription>Daily revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                Loading chart...
              </div>
            ) : revenue?.breakdown ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenue.breakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Load Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Load Status Distribution</CardTitle>
            <CardDescription>Current load status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  {
                    name: 'Active',
                    value: stats?.loads?.active || 0,
                  },
                  {
                    name: 'Pending',
                    value: stats?.loads?.pending || 0,
                  },
                  {
                    name: 'Completed',
                    value: stats?.loads?.completed || 0,
                  },
                  {
                    name: 'Cancelled',
                    value: stats?.loads?.cancelled || 0,
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Utilization */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Fleet Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>In Use</span>
                  <span className="font-medium">
                    {stats?.trucks?.inUse || 0}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${
                        ((stats?.trucks?.inUse || 0) /
                          ((stats?.trucks?.inUse || 0) +
                            (stats?.trucks?.available || 0) +
                            (stats?.trucks?.maintenance || 0))) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Available</span>
                  <span className="font-medium">
                    {stats?.trucks?.available || 0}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${
                        ((stats?.trucks?.available || 0) /
                          ((stats?.trucks?.inUse || 0) +
                            (stats?.trucks?.available || 0) +
                            (stats?.trucks?.maintenance || 0))) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Maintenance</span>
                  <span className="font-medium">
                    {stats?.trucks?.maintenance || 0}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{
                      width: `${
                        ((stats?.trucks?.maintenance || 0) /
                          ((stats?.trucks?.inUse || 0) +
                            (stats?.trucks?.available || 0) +
                            (stats?.trucks?.maintenance || 0))) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Driver Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Active Drivers</p>
                  <p className="text-sm text-muted-foreground">On duty or driving</p>
                </div>
                <p className="text-2xl font-bold">
                  {stats?.drivers?.active || 0}
                </p>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Available Drivers</p>
                  <p className="text-sm text-muted-foreground">Ready for assignment</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.drivers?.available || 0}
                </p>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">On Leave</p>
                  <p className="text-sm text-muted-foreground">Not available</p>
                </div>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats?.drivers?.onLeave || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

