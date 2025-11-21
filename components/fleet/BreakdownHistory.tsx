'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
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
  AlertTriangle,
  Search,
  Filter,
  Download,
  Truck,
  User,
  MapPin,
  Clock,
  DollarSign,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { formatDate, formatDateTime, formatCurrency, apiUrl } from '@/lib/utils';
import ExportDialog from '@/components/import-export/ExportDialog';

interface Breakdown {
  id: string;
  breakdownNumber: string;
  priority: string;
  status: string;
  reportedAt: string;
  truck: {
    id: string;
    truckNumber: string;
    make: string;
    model: string;
  };
  driver?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  location: string;
  city?: string;
  state?: string;
  breakdownType: string;
  totalCost: number;
  downtimeHours?: number | null;
  serviceProvider?: string | null;
}

interface BreakdownHistoryStats {
  total: number;
  resolved: number;
  totalCost: number;
  averageDowntime: number;
  byPriority: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  byType: Record<string, number>;
  recurringTrucks: Array<{
    truckId: string;
    truckNumber: string;
    count: number;
  }>;
}

async function fetchBreakdownHistory(params: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  truckId?: string;
  driverId?: string;
  breakdownType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.status) queryParams.set('status', params.status);
  if (params.priority) queryParams.set('priority', params.priority);
  if (params.truckId) queryParams.set('truckId', params.truckId);
  if (params.driverId) queryParams.set('driverId', params.driverId);
  if (params.breakdownType) queryParams.set('breakdownType', params.breakdownType);
  if (params.startDate) queryParams.set('startDate', params.startDate);
  if (params.endDate) queryParams.set('endDate', params.endDate);
  if (params.search) queryParams.set('search', params.search);

  const response = await fetch(apiUrl(`/api/breakdowns?${queryParams.toString()}`));
  if (!response.ok) throw new Error('Failed to fetch breakdown history');
  return response.json();
}

async function fetchBreakdownStats(params: {
  startDate?: string;
  endDate?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.startDate) queryParams.set('startDate', params.startDate);
  if (params.endDate) queryParams.set('endDate', params.endDate);

  const response = await fetch(apiUrl(`/api/fleet/breakdowns/stats?${queryParams.toString()}`));
  if (!response.ok) throw new Error('Failed to fetch breakdown stats');
  return response.json();
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'CRITICAL':
      return <Badge className="bg-red-500 text-white">🔴 CRITICAL</Badge>;
    case 'HIGH':
      return <Badge className="bg-orange-500 text-white">🟡 HIGH</Badge>;
    case 'MEDIUM':
      return <Badge className="bg-yellow-500 text-white">🟢 MEDIUM</Badge>;
    case 'LOW':
      return <Badge className="bg-blue-500 text-white">⚪ LOW</Badge>;
    default:
      return <Badge>{priority}</Badge>;
  }
}

function getStatusBadge(status: string) {
  const statusColors: Record<string, string> = {
    REPORTED: 'bg-gray-500',
    DISPATCHED: 'bg-blue-500',
    IN_PROGRESS: 'bg-yellow-500',
    WAITING_PARTS: 'bg-orange-500',
    COMPLETED: 'bg-green-500',
    RESOLVED: 'bg-green-500',
    CANCELLED: 'bg-gray-500',
  };
  return (
    <Badge className={statusColors[status] || 'bg-gray-500'}>
      {status.replace('_', ' ')}
    </Badge>
  );
}

export default function BreakdownHistory() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const searchParams = useSearchParams();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [truckIdFilter, setTruckIdFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  // Set truck filter from URL if present
  useEffect(() => {
    const truckIdFromUrl = searchParams?.get('truckId') || '';
    if (truckIdFromUrl) {
      setTruckIdFilter(truckIdFromUrl);
    }
  }, [searchParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['breakdownHistory', page, statusFilter, priorityFilter, typeFilter, searchQuery, truckIdFilter, dateRange],
    queryFn: () =>
      fetchBreakdownHistory({
        page,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        breakdownType: typeFilter !== 'all' ? typeFilter : undefined,
        search: searchQuery || undefined,
        truckId: truckIdFilter || undefined,
        startDate: dateRange.start,
        endDate: dateRange.end,
      }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['breakdownStats', dateRange],
    queryFn: () =>
      fetchBreakdownStats({
        startDate: dateRange.start,
        endDate: dateRange.end,
      }),
  });

  const breakdowns: Breakdown[] = data?.data?.breakdowns || [];
  const pagination = data?.data?.pagination;
  const stats: BreakdownHistoryStats = statsData?.data || {
    total: 0,
    resolved: 0,
    totalCost: 0,
    averageDowntime: 0,
    byPriority: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
    byType: {},
    recurringTrucks: [],
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading breakdown history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Breakdown History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete history and analysis of all breakdowns
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Breakdowns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.resolved} resolved
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCost)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Average: {stats.total > 0 ? formatCurrency(stats.totalCost / stats.total) : '$0'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Downtime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageDowntime > 0 ? `${stats.averageDowntime.toFixed(1)}h` : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Per breakdown</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recurring Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recurringTrucks.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Trucks with 3+ breakdowns</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by case #, truck, driver..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="REPORTED">Reported</SelectItem>
                  <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priorityFilter} onValueChange={(value) => { setPriorityFilter(value); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="CRITICAL">🔴 Critical</SelectItem>
                  <SelectItem value="HIGH">🟡 High</SelectItem>
                  <SelectItem value="MEDIUM">🟢 Medium</SelectItem>
                  <SelectItem value="LOW">⚪ Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          </div>
        </CardContent>
      </Card>

      {/* Recurring Issues Alert */}
      {stats.recurringTrucks.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <AlertTriangle className="h-5 w-5" />
              Recurring Breakdown Issues
            </CardTitle>
            <CardDescription>
              Trucks with 3 or more breakdowns in this period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.recurringTrucks.map((truck) => (
                <Link key={truck.truckId} href={`/dashboard/trucks/${truck.truckId}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-orange-100">
                    Truck #{truck.truckNumber}: {truck.count} breakdowns
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breakdown Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Breakdown History</CardTitle>
              <CardDescription>
                Showing {breakdowns.length} of {pagination?.total || 0} breakdowns
              </CardDescription>
            </div>
            <ExportDialog entityType="breakdowns" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading breakdowns...</div>
          ) : breakdowns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No breakdowns found</p>
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
                      <TableHead>Driver</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Downtime</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {breakdowns.map((breakdown) => (
                      <TableRow key={breakdown.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/breakdowns/${breakdown.id}`}
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
                            <div>
                              <div className="font-medium">#{breakdown.truck.truckNumber}</div>
                              <div className="text-xs text-muted-foreground">
                                {breakdown.truck.make} {breakdown.truck.model}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {breakdown.driver ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {breakdown.driver.user.firstName} {breakdown.driver.user.lastName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm">{breakdown.location}</div>
                              {(breakdown.city || breakdown.state) && (
                                <div className="text-xs text-muted-foreground">
                                  {breakdown.city && `${breakdown.city}, `}
                                  {breakdown.state}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {breakdown.breakdownType.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell>{getPriorityBadge(breakdown.priority)}</TableCell>
                        <TableCell>{getStatusBadge(breakdown.status)}</TableCell>
                        <TableCell>
                          {breakdown.downtimeHours ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {breakdown.downtimeHours.toFixed(1)}h
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {breakdown.totalCost > 0 ? (
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              {formatCurrency(breakdown.totalCost)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/breakdowns/${breakdown.id}`}>
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

