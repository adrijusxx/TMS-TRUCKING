'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { apiUrl } from '@/lib/utils';

interface TruckPerformance {
  totalTrucks: number;
  availableTrucks: number;
  inUseTrucks: number;
  maintenanceTrucks: number;
  trucksNeedingMaintenance: number;
  topPerformers: Array<{
    id: string;
    truckNumber: string;
    make: string;
    model: string;
    revenue: number;
    loadsCompleted: number;
    utilizationRate: number;
  }>;
  averageUtilizationRate: number;
}

async function fetchTruckPerformance() {
  const response = await fetch(apiUrl('/api/dashboard/truck-performance'));
  if (!response.ok) throw new Error('Failed to fetch truck performance');
  return response.json();
}

export default function TruckPerformanceSummary() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['truck-performance'],
    queryFn: fetchTruckPerformance,
    retry: 2,
    staleTime: 60000, // Cache for 1 minute
  });

  const performance: TruckPerformance = data?.data || {
    totalTrucks: 0,
    availableTrucks: 0,
    inUseTrucks: 0,
    maintenanceTrucks: 0,
    trucksNeedingMaintenance: 0,
    topPerformers: [],
    averageUtilizationRate: 0,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Truck Performance
            </CardTitle>
            <CardDescription>Truck status and utilization</CardDescription>
          </div>
          <Link href="/dashboard/trucks">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Loading truck data...
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-2">
              Failed to load truck performance data
            </p>
            <p className="text-xs text-muted-foreground">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Trucks</p>
                <p className="text-2xl font-bold">{performance.totalTrucks}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {performance.availableTrucks}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Use</p>
                <p className="text-2xl font-bold text-blue-600">
                  {performance.inUseTrucks}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-bold text-orange-600">
                  {performance.maintenanceTrucks}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Average Utilization Rate</p>
                <p className="text-xl font-bold">
                  {performance.averageUtilizationRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {performance.trucksNeedingMaintenance > 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Wrench className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  {performance.trucksNeedingMaintenance} truck(s) need maintenance
                </span>
              </div>
            )}

            {performance.topPerformers.length > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium">Top Performing Trucks</p>
                </div>
                <div className="space-y-2">
                  {performance.topPerformers.slice(0, 3).map((truck) => (
                    <Link
                      key={truck.id}
                      href={`/dashboard/trucks/${truck.id}`}
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {truck.truckNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {truck.make} {truck.model}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="text-right">
                          <p className="text-muted-foreground">Loads</p>
                          <p className="font-medium">{truck.loadsCompleted}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground">Utilization</p>
                          <p className="font-medium">{truck.utilizationRate.toFixed(0)}%</p>
                        </div>
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

