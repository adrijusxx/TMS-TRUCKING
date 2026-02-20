'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table } from 'lucide-react';
import type { FleetUtilizationPeriod } from '@/lib/managers/fleet-monitoring/types';

interface Props {
  data: FleetUtilizationPeriod[];
  loading: boolean;
}

function rateColor(rate: number) {
  if (rate >= 80) return 'text-green-600 font-medium';
  if (rate >= 50) return 'text-amber-600 font-medium';
  return 'text-red-600 font-medium';
}

export default function FleetUtilizationTable({ data, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Table className="h-4 w-4" />
            Period Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Table className="h-4 w-4" />
          Period Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Period</th>
                  <th className="pb-2 pr-4 font-medium text-center">Trucks</th>
                  <th className="pb-2 pr-4 font-medium text-center">Trailers</th>
                  <th className="pb-2 pr-4 font-medium text-center">Drivers</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.period} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-muted-foreground text-xs">{row.period}</td>
                    <td className="py-2 pr-4 text-center">
                      <span className={rateColor(row.truckUtilizationRate)}>
                        {row.truckUtilizationRate}%
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({row.activeTrucks}/{row.totalTrucks})
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-center">
                      <span className={rateColor(row.trailerUtilizationRate)}>
                        {row.trailerUtilizationRate}%
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({row.activeTrailers}/{row.totalTrailers})
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-center">
                      <span className={rateColor(row.driverUtilizationRate)}>
                        {row.driverUtilizationRate}%
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({row.busyDrivers}/{row.totalDrivers})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
