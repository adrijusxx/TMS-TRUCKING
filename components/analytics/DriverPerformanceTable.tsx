'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { apiUrl } from '@/lib/utils';

interface DriverPerformance {
  driverNumber: string;
  driverName: string;
  loadsCompleted: number;
  totalRevenue: number;
  totalMiles: number;
  revenuePerMile: number;
  onTimePercentage: number;
  profitability: number;
  rank: number;
}

export function DriverPerformanceTable() {
  const [drivers, setDrivers] = useState<DriverPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDriverPerformance();
  }, []);

  const fetchDriverPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(apiUrl('/api/analytics/drivers/performance'));
      
      if (!response.ok) {
        throw new Error('Failed to fetch driver performance data');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch driver performance data');
      }
      
      // Map API response to component format
      const performanceData: DriverPerformance[] = result.data.map((driver: any, index: number) => ({
        driverNumber: driver.driverNumber || `D-${String(index + 1).padStart(3, '0')}`,
        driverName: driver.driverName,
        loadsCompleted: driver.metrics?.completedLoads || 0,
        totalRevenue: driver.metrics?.totalRevenue || 0,
        totalMiles: driver.metrics?.totalMiles || 0,
        revenuePerMile: driver.rates?.revenuePerMile || 0,
        onTimePercentage: driver.rates?.onTimeRate || 0,
        profitability: driver.rates?.profitMargin || 0,
        rank: index + 1,
      }));
      
      setDrivers(performanceData);
    } catch (error) {
      console.error('Error fetching driver performance:', error);
      setError(error instanceof Error ? error.message : 'Failed to load driver performance data');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 95) return <Badge className="bg-green-500">Excellent</Badge>;
    if (percentage >= 90) return <Badge className="bg-blue-500">Good</Badge>;
    if (percentage >= 85) return <Badge className="bg-yellow-500">Average</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Driver Performance Metrics</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Driver Performance Metrics</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <button
              onClick={fetchDriverPerformance}
              className="text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (drivers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Driver Performance Metrics</CardTitle>
          <CardDescription>No driver performance data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No driver performance data found for the selected period.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Performance Metrics</CardTitle>
        <CardDescription>
          Ranking drivers by revenue, efficiency, and on-time performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Rank</th>
                <th className="text-left p-3 font-medium">Driver</th>
                <th className="text-right p-3 font-medium">Loads</th>
                <th className="text-right p-3 font-medium">Revenue</th>
                <th className="text-right p-3 font-medium">Miles</th>
                <th className="text-right p-3 font-medium">$/Mile</th>
                <th className="text-center p-3 font-medium">On-Time %</th>
                <th className="text-right p-3 font-medium">Profitability</th>
                <th className="text-center p-3 font-medium">Rating</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.driverNumber} className="border-t hover:bg-muted/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">#{driver.rank}</span>
                      {driver.rank === 1 && <TrendingUp className="h-4 w-4 text-green-500" />}
                    </div>
                  </td>
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{driver.driverName}</div>
                      <div className="text-xs text-muted-foreground">{driver.driverNumber}</div>
                    </div>
                  </td>
                  <td className="p-3 text-right font-medium">{driver.loadsCompleted}</td>
                  <td className="p-3 text-right font-medium">
                    ${driver.totalRevenue.toLocaleString()}
                  </td>
                  <td className="p-3 text-right">{driver.totalMiles.toLocaleString()}</td>
                  <td className="p-3 text-right font-bold text-green-600">
                    ${driver.revenuePerMile.toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`font-medium ${
                        driver.onTimePercentage >= 95
                          ? 'text-green-600'
                          : driver.onTimePercentage >= 90
                          ? 'text-blue-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {driver.onTimePercentage}%
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-green-600">
                    {driver.profitability}%
                  </td>
                  <td className="p-3 text-center">{getPerformanceBadge(driver.onTimePercentage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Performance Insights */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Top Performer</p>
            <p className="text-xl font-bold">{drivers[0]?.driverName}</p>
            <p className="text-sm text-green-600">
              ${drivers[0]?.revenuePerMile.toFixed(2)}/mile
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Best On-Time %</p>
            <p className="text-xl font-bold">
              {Math.max(...drivers.map((d) => d.onTimePercentage))}%
            </p>
            <p className="text-sm text-green-600">Excellent reliability</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Avg Profitability</p>
            <p className="text-xl font-bold">
              {(drivers.reduce((sum, d) => sum + d.profitability, 0) / drivers.length).toFixed(1)}%
            </p>
            <p className="text-sm text-green-600">Above target</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}





