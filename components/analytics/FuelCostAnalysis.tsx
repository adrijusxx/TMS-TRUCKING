'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Fuel, TrendingUp, DollarSign, Gauge, AlertTriangle, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

async function fetchFuelAnalysis(startDate: string, endDate: string) {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await fetch(apiUrl(`/api/analytics/fuel?${params}`));
  if (!response.ok) throw new Error('Failed to fetch fuel analysis');
  return response.json();
}

/** Compute anomaly threshold: trucks whose avg cost/gallon is >20% above fleet average */
function buildAnomalyMap(byTruck: any[]): Record<string, boolean> {
  if (byTruck.length === 0) return {};
  const fleetAvg =
    byTruck.reduce((sum: number, t: any) => sum + (t.averageCostPerGallon ?? 0), 0) /
    byTruck.length;
  const threshold = fleetAvg * 1.2;
  const map: Record<string, boolean> = {};
  byTruck.forEach((t: any) => {
    map[t.truckId] = (t.averageCostPerGallon ?? 0) > threshold;
  });
  return map;
}

export default function FuelCostAnalysis() {
  const [startDate, setStartDate] = useState(
    format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [truckFilter, setTruckFilter] = useState<string>('all');

  // Fuel estimator state
  const [estMiles, setEstMiles] = useState('');
  const [estMpg, setEstMpg] = useState('');
  const [estPrice, setEstPrice] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['fuel-analysis', startDate, endDate],
    queryFn: () => fetchFuelAnalysis(startDate, endDate),
  });

  const summary = data?.data?.summary;
  const byTruck: any[] = data?.data?.byTruck || [];
  const monthlyTrend: any[] = data?.data?.monthlyTrend || [];

  // Filter truck table
  const filteredTrucks = useMemo(
    () => (truckFilter === 'all' ? byTruck : byTruck.filter((t: any) => t.truckId === truckFilter)),
    [byTruck, truckFilter]
  );

  const anomalyMap = useMemo(() => buildAnomalyMap(byTruck), [byTruck]);

  // Fuel estimator calculation
  const estGallons = estMiles && estMpg ? parseFloat(estMiles) / parseFloat(estMpg) : null;
  const estCost = estGallons && estPrice ? estGallons * parseFloat(estPrice) : null;

  return (
    <div className="space-y-6">
      {/* Date Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
              <div className="text-2xl font-bold">{formatCurrency(summary.totalCost)}</div>
              <p className="text-xs text-muted-foreground mt-1">{summary.totalGallons.toFixed(1)} gallons</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Cost/Gallon</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.averageCostPerGallon)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fleet MPG</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.milesPerGallon.toFixed(1)} MPG</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Per Mile</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.fuelCostPerMile)}</div>
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
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={(v) => format(new Date(v + '-01'), 'MMM yy')} />
                <YAxis tickFormatter={(v) => `$${v.toFixed(0)}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={(l) => format(new Date(l + '-01'), 'MMMM yyyy')} />
                <Bar dataKey="totalCost" fill="#3b82f6" name="Total Cost" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* By Truck Breakdown — with truck filter + anomaly flags */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Fuel Costs by Truck</CardTitle>
              <CardDescription>
                Breakdown of fuel consumption by vehicle.{' '}
                <span className="text-amber-600 font-medium">Orange = &gt;20% above fleet average cost/gallon</span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {byTruck.length > 0 && (
                <>
                  <Select value={truckFilter} onValueChange={setTruckFilter}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="All Trucks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Trucks</SelectItem>
                      {byTruck.map((t: any) => (
                        <SelectItem key={t.truckId} value={t.truckId}>
                          {t.truckNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading fuel data...</div>
          ) : filteredTrucks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No fuel data available for the selected period</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Truck</TableHead>
                    <TableHead className="text-right">Total Gallons</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Avg Cost/Gal</TableHead>
                    <TableHead className="text-right">Entries</TableHead>
                    <TableHead className="text-right">Flag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrucks.map((truck: any) => {
                    const isAnomaly = anomalyMap[truck.truckId];
                    return (
                      <TableRow key={truck.truckId} className={isAnomaly ? 'bg-amber-50 dark:bg-amber-950/10' : undefined}>
                        <TableCell className="font-medium">{truck.truckNumber}</TableCell>
                        <TableCell className="text-right">{truck.gallons.toFixed(1)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(truck.totalCost)}</TableCell>
                        <TableCell className={`text-right ${isAnomaly ? 'text-amber-600 font-semibold' : ''}`}>
                          {formatCurrency(truck.averageCostPerGallon)}
                        </TableCell>
                        <TableCell className="text-right">{truck.entries}</TableCell>
                        <TableCell className="text-right">
                          {isAnomaly && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              High
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route Fuel Estimator */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Route Fuel Estimator</CardTitle>
              <CardDescription>Estimate fuel cost for a route before dispatching</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="estMiles">Route Miles</Label>
              <Input
                id="estMiles"
                type="number"
                min="0"
                placeholder="e.g. 500"
                value={estMiles}
                onChange={(e) => setEstMiles(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estMpg">
                Truck MPG
                {summary && (
                  <span className="text-xs text-muted-foreground ml-1">(fleet avg: {summary.milesPerGallon.toFixed(1)})</span>
                )}
              </Label>
              <Input
                id="estMpg"
                type="number"
                min="0"
                step="0.1"
                placeholder={summary ? summary.milesPerGallon.toFixed(1) : 'e.g. 6.5'}
                value={estMpg}
                onChange={(e) => setEstMpg(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estPrice">
                Diesel Price ($/gal)
                {summary && (
                  <span className="text-xs text-muted-foreground ml-1">(avg: {formatCurrency(summary.averageCostPerGallon)})</span>
                )}
              </Label>
              <Input
                id="estPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder={summary ? summary.averageCostPerGallon.toFixed(2) : 'e.g. 3.85'}
                value={estPrice}
                onChange={(e) => setEstPrice(e.target.value)}
              />
            </div>
          </div>

          {estGallons !== null && estCost !== null && (
            <div className="mt-4 flex gap-4 flex-wrap">
              <div className="rounded-lg border bg-muted/50 px-5 py-3 text-center min-w-[140px]">
                <div className="text-2xl font-bold text-primary">{formatCurrency(estCost)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Estimated Fuel Cost</div>
              </div>
              <div className="rounded-lg border bg-muted/50 px-5 py-3 text-center min-w-[140px]">
                <div className="text-2xl font-bold">{estGallons.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Gallons Needed</div>
              </div>
              {estMiles && (
                <div className="rounded-lg border bg-muted/50 px-5 py-3 text-center min-w-[140px]">
                  <div className="text-2xl font-bold">{formatCurrency(estCost / parseFloat(estMiles))}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Fuel Cost Per Mile</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
