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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Truck,
  Calendar,
  AlertCircle,
  BarChart3,
  Filter,
} from 'lucide-react';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';

interface CostSummary {
  totalCost: number;
  averageCost: number;
  breakdownCount: number;
  byType: Record<string, { count: number; totalCost: number; averageCost: number }>;
  byTruck: Array<{
    truckId: string;
    truckNumber: string;
    count: number;
    totalCost: number;
  }>;
  byMonth: Array<{
    month: string;
    count: number;
    totalCost: number;
  }>;
  costTrend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface BreakdownCost {
  id: string;
  breakdownNumber: string;
  truck: {
    id: string;
    truckNumber: string;
  };
  breakdownType: string;
  reportedAt: string;
  totalCost: number;
  repairCost?: number;
  towingCost?: number;
  laborCost?: number;
  partsCost?: number;
  otherCosts?: number;
  status: string;
}

async function fetchCostSummary(params: {
  startDate?: string;
  endDate?: string;
  truckId?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.startDate) queryParams.set('startDate', params.startDate);
  if (params.endDate) queryParams.set('endDate', params.endDate);
  if (params.truckId) queryParams.set('truckId', params.truckId);

  const response = await fetch(apiUrl(`/api/fleet/breakdowns/cost-summary?${queryParams.toString()}`));
  if (!response.ok) throw new Error('Failed to fetch cost summary');
  return response.json();
}

async function fetchBreakdownCosts(params: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  truckId?: string;
  minCost?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.startDate) queryParams.set('startDate', params.startDate);
  if (params.endDate) queryParams.set('endDate', params.endDate);
  if (params.truckId) queryParams.set('truckId', params.truckId);
  if (params.minCost) queryParams.set('minCost', params.minCost.toString());

  const response = await fetch(apiUrl(`/api/fleet/breakdowns/costs?${queryParams.toString()}`));
  if (!response.ok) throw new Error('Failed to fetch breakdown costs');
  return response.json();
}

export default function BreakdownCostTracking() {
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [minCostFilter, setMinCostFilter] = useState<string>('0');

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['breakdownCostSummary', dateRange],
    queryFn: () =>
      fetchCostSummary({
        startDate: dateRange.start,
        endDate: dateRange.end,
      }),
  });

  const { data: costsData, isLoading: costsLoading } = useQuery({
    queryKey: ['breakdownCosts', page, dateRange, minCostFilter],
    queryFn: () =>
      fetchBreakdownCosts({
        page,
        limit: 20,
        startDate: dateRange.start,
        endDate: dateRange.end,
        minCost: parseFloat(minCostFilter) > 0 ? parseFloat(minCostFilter) : undefined,
      }),
  });

  const summary: CostSummary = summaryData?.data || {
    totalCost: 0,
    averageCost: 0,
    breakdownCount: 0,
    byType: {},
    byTruck: [],
    byMonth: [],
    costTrend: 'stable',
    trendPercentage: 0,
  };

  const costs: BreakdownCost[] = costsData?.data?.breakdowns || [];
  const pagination = costsData?.data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground mt-1">
          Track and analyze breakdown expenses and costs
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalCost)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {summary.breakdownCount} breakdowns
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.averageCost)}</div>
            <div className="text-xs text-muted-foreground mt-1">Per breakdown</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {summary.costTrend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : summary.costTrend === 'down' ? (
                <TrendingDown className="h-4 w-4 text-green-500" />
              ) : (
                <BarChart3 className="h-4 w-4 text-gray-500" />
              )}
              Cost Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${summary.costTrend === 'up'
                  ? 'text-red-600'
                  : summary.costTrend === 'down'
                    ? 'text-green-600'
                    : 'text-gray-600'
                }`}
            >
              {summary.trendPercentage > 0 ? '+' : ''}
              {summary.trendPercentage.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">vs previous period</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Breakdowns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.breakdownCount}</div>
            <div className="text-xs text-muted-foreground mt-1">With costs recorded</div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown by Type */}
      {Object.keys(summary.byType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cost by Breakdown Type</CardTitle>
            <CardDescription>Total costs grouped by breakdown type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary.byType)
                .sort((a, b) => b[1].totalCost - a[1].totalCost)
                .map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{type.replace(/_/g, ' ')}</div>
                      <div className="text-sm text-muted-foreground">
                        {data.count} breakdown{data.count !== 1 ? 's' : ''} • Avg:{' '}
                        {formatCurrency(data.averageCost)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{formatCurrency(data.totalCost)}</div>
                      <div className="text-xs text-muted-foreground">
                        {((data.totalCost / summary.totalCost) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Cost Trucks */}
      {summary.byTruck.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Cost Trucks</CardTitle>
            <CardDescription>Trucks with highest breakdown costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.byTruck.slice(0, 5).map((truck) => (
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
                        {truck.count} breakdown{truck.count !== 1 ? 's' : ''}
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => {
                    setDateRange({ ...dateRange, start: e.target.value });
                    setPage(1);
                  }}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => {
                    setDateRange({ ...dateRange, end: e.target.value });
                    setPage(1);
                  }}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Minimum Cost</Label>
              <Input
                type="number"
                placeholder="0"
                value={minCostFilter}
                onChange={(e) => {
                  setMinCostFilter(e.target.value);
                  setPage(1);
                }}
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Costs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Breakdown Costs</CardTitle>
          <CardDescription>
            Showing {costs.length} of {pagination?.total || 0} breakdowns with costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {costsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading costs...</div>
          ) : costs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No breakdown costs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Truck</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Repair</TableHead>
                      <TableHead>Towing</TableHead>
                      <TableHead>Labor</TableHead>
                      <TableHead>Parts</TableHead>
                      <TableHead>Other</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costs.map((breakdown) => (
                      <TableRow key={breakdown.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/fleet`}
                            className="font-mono text-sm font-semibold hover:underline"
                          >
                            {breakdown.breakdownNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{formatDate(breakdown.reportedAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <Link
                              href={`/dashboard/trucks/${breakdown.truck.id}`}
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              #{breakdown.truck.truckNumber}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {breakdown.breakdownType.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {breakdown.repairCost ? (
                            <span className="text-sm">{formatCurrency(breakdown.repairCost)}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {breakdown.towingCost ? (
                            <span className="text-sm">{formatCurrency(breakdown.towingCost)}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {breakdown.laborCost ? (
                            <span className="text-sm">{formatCurrency(breakdown.laborCost)}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {breakdown.partsCost ? (
                            <span className="text-sm">{formatCurrency(breakdown.partsCost)}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {breakdown.otherCosts ? (
                            <span className="text-sm">{formatCurrency(breakdown.otherCosts)}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-semibold">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            {formatCurrency(breakdown.totalCost)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/fleet`}>
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

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

