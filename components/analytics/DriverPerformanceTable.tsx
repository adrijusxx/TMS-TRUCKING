'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

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

  useEffect(() => {
    fetchDriverPerformance();
  }, []);

  const fetchDriverPerformance = async () => {
    try {
      // TODO: Implement API endpoint
      // For now, using mock data
      const mockData: DriverPerformance[] = [
        {
          driverNumber: 'D-001',
          driverName: 'John Smith',
          loadsCompleted: 45,
          totalRevenue: 125000,
          totalMiles: 62500,
          revenuePerMile: 2.0,
          onTimePercentage: 98,
          profitability: 22,
          rank: 1,
        },
        {
          driverNumber: 'D-002',
          driverName: 'Jane Doe',
          loadsCompleted: 42,
          totalRevenue: 118000,
          totalMiles: 59000,
          revenuePerMile: 2.0,
          onTimePercentage: 95,
          profitability: 20,
          rank: 2,
        },
        {
          driverNumber: 'D-003',
          driverName: 'Mike Johnson',
          loadsCompleted: 38,
          totalRevenue: 98000,
          totalMiles: 56000,
          revenuePerMile: 1.75,
          onTimePercentage: 92,
          profitability: 18,
          rank: 3,
        },
      ];
      setDrivers(mockData);
    } catch (error) {
      console.error('Error fetching driver performance:', error);
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

