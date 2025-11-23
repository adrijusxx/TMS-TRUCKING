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
import { Fuel, TrendingUp, DollarSign, Gauge } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

async function fetchFuelAnalysis(startDate: string, endDate: string, truckId?: string) {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });
  if (truckId) params.set('truckId', truckId);

  const response = await fetch(apiUrl(`/api/analytics/fuel?${params}`));
  if (!response.ok) throw new Error('Failed to fetch fuel analysis');
  return response.json();
}

export default function FuelCostAnalysis() {
  const [startDate, setStartDate] = useState(
    format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data, isLoading } = useQuery({
    queryKey: ['fuel-analysis', startDate, endDate],
    queryFn: () => fetchFuelAnalysis(startDate, endDate),
  });

  const summary = data?.data?.summary;
  const byTruck = data?.data?.byTruck || [];
  const monthlyTrend = data?.data?.monthlyTrend || [];

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
              <CardTitle className="text-sm font-medium">Total Fuel Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.totalCost)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.totalGallons.toFixed(1)} gallons
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Cost/Gallon</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.averageCostPerGallon)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Miles Per Gallon</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.milesPerGallon.toFixed(1)} MPG
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Per Mile</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.fuelCostPerMile)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Trend Chart */}
      {monthlyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Fuel Cost Trend</CardTitle>
            <CardDescription>Fuel costs over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(value) => format(new Date(value + '-01'), 'MMM yyyy')}
                />
                <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => format(new Date(label + '-01'), 'MMMM yyyy')}
                />
                <Bar dataKey="totalCost" fill="#3b82f6" name="Total Cost" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* By Truck Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fuel Costs by Truck</CardTitle>
              <CardDescription>Breakdown of fuel consumption by vehicle</CardDescription>
            </div>
            {byTruck.length > 0 && (
              <ExportButton
                data={byTruck.map((truck: any) => ({
                  'Truck Number': truck.truckNumber,
                  'Total Gallons': truck.gallons.toFixed(1),
                  'Total Cost': formatCurrencyForExport(truck.totalCost),
                  'Average Cost Per Gallon': formatCurrencyForExport(truck.averageCostPerGallon),
                  'Entries': truck.entries,
                }))}
                filename={`fuel-analysis-trucks-${startDate}-${endDate}`}
                headers={['Truck Number', 'Total Gallons', 'Total Cost', 'Average Cost Per Gallon', 'Entries']}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading fuel data...</div>
          ) : byTruck.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No fuel data available for the selected period
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Truck</TableHead>
                    <TableHead className="text-right">Total Gallons</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Avg Cost/Gallon</TableHead>
                    <TableHead className="text-right">Entries</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byTruck.map((truck: any) => (
                    <TableRow key={truck.truckId}>
                      <TableCell className="font-medium">
                        {truck.truckNumber}
                      </TableCell>
                      <TableCell className="text-right">
                        {truck.gallons.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(truck.totalCost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(truck.averageCostPerGallon)}
                      </TableCell>
                      <TableCell className="text-right">
                        {truck.entries}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

