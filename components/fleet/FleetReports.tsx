'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  Clock,
  DollarSign,
  AlertTriangle,
  Truck,
  Calendar,
  Download,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import ExportDialog from '@/components/import-export/ExportDialog';

interface BreakdownReport {
  totalBreakdowns: number;
  resolvedBreakdowns: number;
  averageResponseTime: number; // hours
  averageResolutionTime: number; // hours
  averageDowntime: number; // hours
  totalCost: number;
  averageCost: number;
  mtbf: number; // Mean Time Between Failures (days)
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  byTruck: Array<{
    truckId: string;
    truckNumber: string;
    count: number;
    totalCost: number;
    averageDowntime: number;
  }>;
  byMonth: Array<{
    month: string;
    count: number;
    totalCost: number;
    averageDowntime: number;
  }>;
  vendorPerformance: Array<{
    vendorName: string;
    count: number;
    averageResponseTime: number;
    averageResolutionTime: number;
    totalCost: number;
  }>;
}

async function fetchBreakdownReport(params: {
  startDate?: string;
  endDate?: string;
  truckId?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.startDate) queryParams.set('startDate', params.startDate);
  if (params.endDate) queryParams.set('endDate', params.endDate);
  if (params.truckId) queryParams.set('truckId', params.truckId);

  const response = await fetch(apiUrl(`/api/fleet/breakdowns/report?${queryParams.toString()}`));
  if (!response.ok) throw new Error('Failed to fetch breakdown report');
  return response.json();
}

export default function FleetReports() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['breakdownReport', dateRange],
    queryFn: () =>
      fetchBreakdownReport({
        startDate: dateRange.start,
        endDate: dateRange.end,
      }),
  });

  const report: BreakdownReport = data?.data || {
    totalBreakdowns: 0,
    resolvedBreakdowns: 0,
    averageResponseTime: 0,
    averageResolutionTime: 0,
    averageDowntime: 0,
    totalCost: 0,
    averageCost: 0,
    mtbf: 0,
    byType: {},
    byPriority: {},
    byTruck: [],
    byMonth: [],
    vendorPerformance: [],
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading report</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Comprehensive breakdown analysis and performance metrics
          </p>
        </div>
        <ExportDialog entityType="breakdowns" />
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Report Period</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-[150px]"
              />
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-[150px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Breakdowns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.totalBreakdowns}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {report.resolvedBreakdowns} resolved
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.averageResponseTime > 0
                ? `${report.averageResponseTime.toFixed(1)}h`
                : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Time to dispatch</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              MTBF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.mtbf > 0 ? `${report.mtbf.toFixed(1)} days` : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Mean Time Between Failures</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(report.totalCost)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Avg: {formatCurrency(report.averageCost)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdowns by Type */}
      {Object.keys(report.byType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Breakdowns by Type</CardTitle>
            <CardDescription>Frequency of different breakdown types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(report.byType)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{type.replace(/_/g, ' ')}</div>
                      <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(count / report.totalBreakdowns) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-lg font-bold">{count}</div>
                      <div className="text-xs text-muted-foreground">
                        {((count / report.totalBreakdowns) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Trends */}
      {report.byMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Breakdown Trends</CardTitle>
            <CardDescription>Breakdown frequency and costs over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.byMonth.map((month) => (
                <div key={month.month} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {new Date(month.month + '-01').toLocaleString('default', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {month.count} breakdown{month.count !== 1 ? 's' : ''} • Avg downtime:{' '}
                      {month.averageDowntime.toFixed(1)}h
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(month.totalCost)}</div>
                    <div className="text-xs text-muted-foreground">
                      Avg: {formatCurrency(month.totalCost / month.count)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Problem Trucks */}
      {report.byTruck.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Problem Trucks</CardTitle>
            <CardDescription>Trucks with most breakdowns and highest costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.byTruck.slice(0, 10).map((truck) => (
                <div
                  key={truck.truckId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Link
                        href={`/dashboard/trucks/${truck.truckId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        Truck #{truck.truckNumber}
                      </Link>
                      <div className="text-sm text-muted-foreground">
                        {truck.count} breakdown{truck.count !== 1 ? 's' : ''} • Avg downtime:{' '}
                        {truck.averageDowntime.toFixed(1)}h
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(truck.totalCost)}</div>
                    <div className="text-xs text-muted-foreground">
                      Avg: {formatCurrency(truck.totalCost / truck.count)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vendor Performance */}
      {report.vendorPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vendor Performance</CardTitle>
            <CardDescription>Service provider response and resolution metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Breakdowns</TableHead>
                    <TableHead>Avg Response</TableHead>
                    <TableHead>Avg Resolution</TableHead>
                    <TableHead>Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.vendorPerformance.map((vendor) => (
                    <TableRow key={vendor.vendorName}>
                      <TableCell className="font-medium">{vendor.vendorName}</TableCell>
                      <TableCell>{vendor.count}</TableCell>
                      <TableCell>
                        {vendor.averageResponseTime > 0
                          ? `${vendor.averageResponseTime.toFixed(1)}h`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {vendor.averageResolutionTime > 0
                          ? `${vendor.averageResolutionTime.toFixed(1)}h`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{formatCurrency(vendor.totalCost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

