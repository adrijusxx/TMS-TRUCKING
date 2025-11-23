'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, apiUrl } from '@/lib/utils';
import { formatCurrencyForExport } from '@/lib/export';
import ExportButton from './ExportButton';
import { MapPin, TrendingDown, DollarSign, Gauge } from 'lucide-react';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';

async function fetchEmptyMiles(startDate: string, endDate: string, truckId?: string, driverId?: string) {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });
  if (truckId) params.set('truckId', truckId);
  if (driverId) params.set('driverId', driverId);

  const response = await fetch(apiUrl(`/api/analytics/empty-miles?${params}`));
  if (!response.ok) throw new Error('Failed to fetch empty miles data');
  return response.json();
}

export default function EmptyMilesAnalysis() {
  const [startDate, setStartDate] = useState(
    format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data, isLoading } = useQuery({
    queryKey: ['empty-miles', startDate, endDate],
    queryFn: () => fetchEmptyMiles(startDate, endDate),
  });

  const summary = data?.data?.summary;
  const byTruck = data?.data?.byTruck || [];
  const byDriver = data?.data?.byDriver || [];
  const byLane = data?.data?.byLane || [];

  const getPercentageColor = (percentage: number) => {
    if (percentage < 20) return 'text-green-600';
    if (percentage < 35) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empty Miles</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.totalEmptyMiles.toLocaleString()} mi
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.emptyMilesPercentage.toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loaded Miles</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.totalLoadedMiles.toLocaleString()} mi
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empty Miles Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.emptyMilesCost)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                @ {formatCurrency(summary.avgFuelCostPerMile)}/mile
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empty Miles %</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPercentageColor(summary.emptyMilesPercentage)}`}>
                {summary.emptyMilesPercentage.toFixed(1)}%
              </div>
              <Progress
                value={summary.emptyMilesPercentage}
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* By Truck */}
      {byTruck.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Empty Miles by Truck</CardTitle>
            <CardDescription>Breakdown of empty miles by vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Truck</TableHead>
                    <TableHead className="text-right">Loaded Miles</TableHead>
                    <TableHead className="text-right">Empty Miles</TableHead>
                    <TableHead className="text-right">Total Miles</TableHead>
                    <TableHead className="text-right">Empty %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byTruck
                    .sort((a: any, b: any) => b.emptyMiles - a.emptyMiles)
                    .map((truck: any) => (
                      <TableRow key={truck.truckId}>
                        <TableCell className="font-medium">
                          {truck.truckNumber}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {truck.loadedMiles.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {truck.emptyMiles.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {truck.totalMiles.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={getPercentageColor(truck.emptyMilesPercentage)}>
                            {truck.emptyMilesPercentage.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* By Driver */}
      {byDriver.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Empty Miles by Driver</CardTitle>
            <CardDescription>Breakdown of empty miles by driver</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead className="text-right">Loaded Miles</TableHead>
                    <TableHead className="text-right">Empty Miles</TableHead>
                    <TableHead className="text-right">Total Miles</TableHead>
                    <TableHead className="text-right">Empty %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byDriver
                    .sort((a: any, b: any) => b.emptyMiles - a.emptyMiles)
                    .map((driver: any) => (
                      <TableRow key={driver.driverId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{driver.driverName}</div>
                            <div className="text-sm text-muted-foreground">
                              {driver.driverNumber}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {driver.loadedMiles.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {driver.emptyMiles.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {driver.totalMiles.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={getPercentageColor(driver.emptyMilesPercentage)}>
                            {driver.emptyMilesPercentage.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* By Lane */}
      {byLane.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Empty Mile Lanes</CardTitle>
                <CardDescription>Lanes with highest empty miles (delivery to next pickup)</CardDescription>
              </div>
              <ExportButton
                data={byLane.map((lane: any) => ({
                  'Lane': lane.lane,
                  'Origin': lane.origin,
                  'Destination': lane.destination,
                  'Empty Miles': lane.emptyMiles.toFixed(0),
                  'Loaded Miles': lane.loadedMiles?.toFixed(0) || '0',
                  'Empty %': `${(lane.emptyPercentage * 100).toFixed(1)}%`,
                  'Cost': formatCurrencyForExport(lane.cost || 0),
                }))}
                filename={`empty-miles-lanes-${startDate}-${endDate}`}
                headers={['Lane', 'Origin', 'Destination', 'Empty Miles', 'Loaded Miles', 'Empty %', 'Cost']}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lane</TableHead>
                    <TableHead className="text-right">Empty Miles</TableHead>
                    <TableHead className="text-right">Avg Empty Miles</TableHead>
                    <TableHead className="text-right">Trips</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byLane.map((lane: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lane.lane}</div>
                          <div className="text-sm text-muted-foreground">
                            {lane.origin} → {lane.destination}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-medium">
                        {lane.emptyMiles.toLocaleString()} mi
                      </TableCell>
                      <TableCell className="text-right">
                        {lane.averageEmptyMiles.toLocaleString()} mi
                      </TableCell>
                      <TableCell className="text-right">
                        {lane.count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="text-center py-8">Loading empty miles data...</div>
      )}

      {!isLoading && !summary && (
        <div className="text-center py-8 text-muted-foreground">
          No empty miles data available for the selected period
        </div>
      )}
    </div>
  );
}

