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
import { Badge } from '@/components/ui/badge';
import { formatCurrency, apiUrl } from '@/lib/utils';
import { formatCurrencyForExport } from '@/lib/export';
import ExportButton from './ExportButton';
import { TrendingUp, TrendingDown, Award, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

async function fetchDriverPerformance(startDate: string, endDate: string, driverId?: string) {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });
  if (driverId) params.set('driverId', driverId);

  const response = await fetch(apiUrl(`/api/analytics/drivers/performance?${params}`));
  if (!response.ok) throw new Error('Failed to fetch driver performance');
  return response.json();
}

export default function DriverPerformanceScorecard() {
  const [startDate, setStartDate] = useState(
    format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data, isLoading } = useQuery({
    queryKey: ['driver-performance', startDate, endDate],
    queryFn: () => fetchDriverPerformance(startDate, endDate),
  });

  const drivers = data?.data || [];
  const meta = data?.meta;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-status-success';
    if (score >= 60) return 'text-status-warning';
    return 'text-status-error';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'destructive';
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

      {/* Summary Stats */}
      {drivers.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Performance Score</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(
                  drivers.reduce((sum: number, d: any) => sum + d.performanceScore, 0) /
                  drivers.length
                ).toFixed(1)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg On-Time Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(
                  drivers.reduce((sum: number, d: any) => sum + d.rates.onTimeRate, 0) /
                  drivers.length
                ).toFixed(1)}
                %
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total HOS Violations</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {drivers.reduce((sum: number, d: any) => sum + d.metrics.totalHOSViolations, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  drivers.reduce((sum: number, d: any) => sum + d.metrics.totalRevenue, 0)
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Driver Performance Rankings</CardTitle>
              <CardDescription>
                Ranked by overall performance score
              </CardDescription>
            </div>
            {drivers.length > 0 && (
              <ExportButton
                data={drivers.map((driver: any, idx: number) => ({
                  'Rank': idx + 1,
                  'Driver': driver.driverName,
                  'Driver Number': driver.driverNumber,
                  'Performance Score': driver.performanceScore.toFixed(1),
                  'Completed Loads': `${driver.metrics.completedLoads} / ${driver.metrics.totalLoads}`,
                  'On-Time Rate': `${driver.rates.onTimeRate.toFixed(1)}%`,
                  'Revenue Per Mile': formatCurrencyForExport(driver.rates.revenuePerMile),
                  'Profit Margin': `${driver.rates.profitMargin.toFixed(1)}%`,
                  'HOS Compliance': `${driver.rates.hosComplianceRate.toFixed(1)}%`,
                  'Total Revenue': formatCurrencyForExport(driver.metrics.totalRevenue),
                  'HOS Violations': driver.metrics.totalHOSViolations,
                }))}
                filename={`driver-performance-${startDate}-${endDate}`}
                headers={['Rank', 'Driver', 'Driver Number', 'Performance Score', 'Completed Loads', 'On-Time Rate', 'Revenue Per Mile', 'Profit Margin', 'HOS Compliance', 'Total Revenue', 'HOS Violations']}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading performance data...</div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No performance data available for the selected period
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead className="text-right">Performance Score</TableHead>
                    <TableHead className="text-right">Completed Loads</TableHead>
                    <TableHead className="text-right">On-Time Rate</TableHead>
                    <TableHead className="text-right">Revenue/Mile</TableHead>
                    <TableHead className="text-right">Profit Margin</TableHead>
                    <TableHead className="text-right">HOS Compliance</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-right">HOS Violations</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver: any, idx: number) => (
                    <TableRow key={driver.driverId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {idx < 3 && (
                            <Award
                              className={`h-5 w-5 ${idx === 0
                                ? 'text-status-warning'
                                : idx === 1
                                  ? 'text-muted-foreground'
                                  : 'text-status-error'
                                }`}
                            />
                          )}
                          <span className="font-medium">#{idx + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{driver.driverName}</div>
                          <div className="text-sm text-muted-foreground">
                            {driver.driverNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getScoreBadge(driver.performanceScore) as any}>
                          <span className={getScoreColor(driver.performanceScore)}>
                            {driver.performanceScore}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {driver.metrics.completedLoads} / {driver.metrics.totalLoads}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {driver.rates.onTimeRate >= 90 ? (
                            <TrendingUp className="h-4 w-4 text-status-success" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-status-error" />
                          )}
                          {driver.rates.onTimeRate.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(driver.rates.revenuePerMile)}
                      </TableCell>
                      <TableCell className="text-right">
                        {driver.rates.profitMargin.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {driver.rates.hosComplianceRate.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(driver.metrics.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {driver.metrics.totalHOSViolations > 0 ? (
                          <span className="text-status-error font-medium">
                            {driver.metrics.totalHOSViolations}
                          </span>
                        ) : (
                          <span className="text-status-success">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/drivers/${driver.driverId}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
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

