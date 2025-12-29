'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Award, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { apiUrl } from '@/lib/utils';

interface DriverPerformance {
  totalDrivers: number;
  availableDrivers: number;
  onDutyDrivers: number;
  offDutyDrivers: number;
  topPerformers: Array<{
    id: string;
    name: string;
    driverNumber: string;
    completionRate: number;
    onTimeRate: number;
    revenue: number;
  }>;
  driversWithViolations: number;
  averageCompletionRate: number;
  averageOnTimeRate: number;
}

async function fetchDriverPerformance() {
  const response = await fetch(apiUrl('/api/dashboard/driver-performance'));
  if (!response.ok) throw new Error('Failed to fetch driver performance');
  return response.json();
}

export default function DriverPerformanceSummary() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['driver-performance'],
    queryFn: fetchDriverPerformance,
    retry: 2,
    staleTime: 60000, // Cache for 1 minute
  });

  const performance: DriverPerformance = data?.data || {
    totalDrivers: 0,
    availableDrivers: 0,
    onDutyDrivers: 0,
    offDutyDrivers: 0,
    topPerformers: [],
    driversWithViolations: 0,
    averageCompletionRate: 0,
    averageOnTimeRate: 0,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Driver Performance
            </CardTitle>
            <CardDescription>Driver status and top performers</CardDescription>
          </div>
          <Link href="/dashboard/drivers">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Loading driver data...
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-2">
              Failed to load driver performance data
            </p>
            <p className="text-xs text-muted-foreground">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Drivers</p>
                <p className="text-2xl font-bold">{performance.totalDrivers}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {performance.availableDrivers}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">On Duty</p>
                <p className="text-2xl font-bold text-blue-600">
                  {performance.onDutyDrivers}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Off Duty</p>
                <p className="text-2xl font-bold text-gray-600">
                  {performance.offDutyDrivers}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Avg Completion Rate</p>
                <p className="text-xl font-bold">
                  {performance.averageCompletionRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg On-Time Rate</p>
                <p className="text-xl font-bold">
                  {performance.averageOnTimeRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {performance.driversWithViolations > 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  {performance.driversWithViolations} driver(s) with HOS violations
                </span>
              </div>
            )}

            {performance.topPerformers.length > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm font-medium">Top Performers</p>
                </div>
                <div className="space-y-2">
                  {performance.topPerformers.slice(0, 3).map((driver) => (
                    <Link
                      key={driver.id}
                      href={`/dashboard/drivers/${driver.id}`}
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {driver.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {driver.driverNumber}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="text-right">
                          <p className="text-muted-foreground">Completion</p>
                          <p className="font-medium">{driver.completionRate.toFixed(0)}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground">On-Time</p>
                          <p className="font-medium">{driver.onTimeRate.toFixed(0)}%</p>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

