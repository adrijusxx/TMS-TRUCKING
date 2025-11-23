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
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Plus,
  Truck,
  User,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { formatDate, formatDateTime, apiUrl } from '@/lib/utils';

interface Inspection {
  id: string;
  inspectionNumber: string;
  inspectionType: string;
  inspectionDate: string;
  status: string;
  defects: number;
  oosStatus: boolean;
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
  performedBy?: string | null;
  location?: string | null;
  nextInspectionDue?: string | null;
  defectDetails?: string | null;
}

interface InspectionStats {
  total: number;
  passed: number;
  failed: number;
  outOfService: number;
  overdue: number;
  withDefects: number;
}

async function fetchInspections(params: {
  page?: number;
  limit?: number;
  status?: string;
  inspectionType?: string;
  truckId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.status) queryParams.set('status', params.status);
  if (params.inspectionType) queryParams.set('inspectionType', params.inspectionType);
  if (params.truckId) queryParams.set('truckId', params.truckId);
  if (params.startDate) queryParams.set('startDate', params.startDate);
  if (params.endDate) queryParams.set('endDate', params.endDate);
  if (params.search) queryParams.set('search', params.search);

  const response = await fetch(apiUrl(`/api/inspections?${queryParams.toString()}`));
  if (!response.ok) throw new Error('Failed to fetch inspections');
  return response.json();
}

async function fetchInspectionStats(params: {
  startDate?: string;
  endDate?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.startDate) queryParams.set('startDate', params.startDate);
  if (params.endDate) queryParams.set('endDate', params.endDate);

  const response = await fetch(apiUrl(`/api/fleet/inspections/stats?${queryParams.toString()}`));
  if (!response.ok) throw new Error('Failed to fetch inspection stats');
  return response.json();
}

function getStatusBadge(status: string, oosStatus: boolean) {
  if (oosStatus) {
    return <Badge className="bg-red-500 text-white">Out of Service</Badge>;
  }
  switch (status) {
    case 'PASSED':
      return <Badge className="bg-green-500 text-white">Passed</Badge>;
    case 'FAILED':
      return <Badge className="bg-red-500 text-white">Failed</Badge>;
    case 'CONDITIONAL':
      return <Badge className="bg-yellow-500 text-white">Conditional</Badge>;
    case 'OUT_OF_SERVICE':
      return <Badge className="bg-red-500 text-white">Out of Service</Badge>;
    case 'PENDING':
      return <Badge className="bg-gray-500 text-white">Pending</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function formatInspectionType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function FleetInspections() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['fleetInspections', page, statusFilter, typeFilter, searchQuery, dateRange],
    queryFn: () =>
      fetchInspections({
        page,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        inspectionType: typeFilter !== 'all' ? typeFilter : undefined,
        search: searchQuery || undefined,
        startDate: dateRange.start,
        endDate: dateRange.end,
      }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['inspectionStats', dateRange],
    queryFn: () =>
      fetchInspectionStats({
        startDate: dateRange.start,
        endDate: dateRange.end,
      }),
  });

  const inspections: Inspection[] = data?.data?.inspections || [];
  const pagination = data?.data?.pagination;
  const stats: InspectionStats = statsData?.data || {
    total: 0,
    passed: 0,
    failed: 0,
    outOfService: 0,
    overdue: 0,
    withDefects: 0,
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading inspections</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground mt-1">
          Track pre-trip, post-trip, and safety inspections
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Passed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              OOS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.outOfService}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.overdue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-purple-500" />
              Defects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.withDefects}</div>
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
                  placeholder="Search by #, truck, driver..."
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
                  <SelectItem value="PASSED">Passed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CONDITIONAL">Conditional</SelectItem>
                  <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="DOT_PRE_TRIP">DOT Pre-Trip</SelectItem>
                  <SelectItem value="DOT_POST_TRIP">DOT Post-Trip</SelectItem>
                  <SelectItem value="DOT_ANNUAL">DOT Annual</SelectItem>
                  <SelectItem value="DOT_LEVEL_1">DOT Level 1</SelectItem>
                  <SelectItem value="DOT_LEVEL_2">DOT Level 2</SelectItem>
                  <SelectItem value="DOT_LEVEL_3">DOT Level 3</SelectItem>
                  <SelectItem value="STATE_INSPECTION">State Inspection</SelectItem>
                  <SelectItem value="COMPANY_INSPECTION">Company Inspection</SelectItem>
                  <SelectItem value="PMI">PMI</SelectItem>
                  <SelectItem value="SAFETY_INSPECTION">Safety Inspection</SelectItem>
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

      {/* Inspections Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inspections</CardTitle>
              <CardDescription>
                Showing {inspections.length} of {pagination?.total || 0} inspections
              </CardDescription>
            </div>
            <Link href="/dashboard/inspections/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Inspection
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading inspections...</div>
          ) : inspections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No inspections found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Inspection #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Truck</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Defects</TableHead>
                      <TableHead>Next Due</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspections.map((inspection) => (
                      <TableRow key={inspection.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/inspections/${inspection.id}`}
                            className="font-mono text-sm font-semibold hover:underline"
                          >
                            {inspection.inspectionNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{formatDate(inspection.inspectionDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatInspectionType(inspection.inspectionType)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Link
                                href={`/dashboard/trucks/${inspection.truck.id}`}
                                className="font-medium text-primary hover:underline"
                              >
                                #{inspection.truck.truckNumber}
                              </Link>
                              <div className="text-xs text-muted-foreground">
                                {inspection.truck.make} {inspection.truck.model}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {inspection.driver ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {inspection.driver.user.firstName} {inspection.driver.user.lastName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(inspection.status, inspection.oosStatus)}</TableCell>
                        <TableCell>
                          {inspection.defects > 0 ? (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              {inspection.defects} {inspection.defects === 1 ? 'defect' : 'defects'}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {inspection.nextInspectionDue ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {formatDate(inspection.nextInspectionDue)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/inspections/${inspection.id}`}>
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

