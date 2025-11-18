'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Plus, Filter, Download, Upload } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import ImportDialog from '@/components/import-export/ImportDialog';
import ExportDialog from '@/components/import-export/ExportDialog';
import BulkActionBar from '@/components/import-export/BulkActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

interface Breakdown {
  id: string;
  breakdownNumber: string;
  truck: {
    id: string;
    truckNumber: string;
    make: string;
    model: string;
  };
  load?: {
    id: string;
    loadNumber: string;
  } | null;
  driver?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  breakdownType: string;
  status: string;
  priority: string;
  location: string;
  reportedAt: Date;
  totalCost: number;
  downtimeHours?: number | null;
}

async function fetchBreakdowns(params: {
  page?: number;
  limit?: number;
  status?: string;
  truckId?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.status) queryParams.set('status', params.status);
  if (params.truckId) queryParams.set('truckId', params.truckId);

  const response = await fetch(`/api/breakdowns?${queryParams}`);
  if (!response.ok) throw new Error('Failed to fetch breakdowns');
  return response.json();
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    REPORTED: 'bg-yellow-100 text-yellow-800',
    DISPATCHED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-orange-100 text-orange-800',
    COMPLETED: 'bg-green-100 text-green-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}

export default function BreakdownList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['breakdowns', page, statusFilter],
    queryFn: () =>
      fetchBreakdowns({
        page,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  });

  const breakdowns: Breakdown[] = data?.data?.breakdowns || [];
  const pagination = data?.data?.pagination;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === breakdowns.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(breakdowns.map((b) => b.id));
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading breakdowns</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Breakdowns</h1>
          <p className="text-muted-foreground">Track and manage truck breakdowns and repairs</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportDialog entityType="breakdowns" onImportComplete={() => refetch()} />
          <ExportDialog entityType="breakdowns" />
          <Link href="/dashboard/breakdowns/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Breakdown
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="REPORTED">Reported</SelectItem>
            <SelectItem value="DISPATCHED">Dispatched</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="WAITING_PARTS">Waiting Parts</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading breakdowns...</div>
        </div>
      ) : breakdowns.length === 0 ? (
        <div className="flex items-center justify-center h-96 border rounded-lg">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No breakdowns found</p>
            <Link href="/dashboard/breakdowns/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Report Breakdown
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === breakdowns.length && breakdowns.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Breakdown #</TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Downtime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdowns.map((breakdown) => (
                  <TableRow key={breakdown.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(breakdown.id)}
                        onCheckedChange={() => toggleSelect(breakdown.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/breakdowns/${breakdown.id}`}
                        className="font-medium hover:underline"
                      >
                        {breakdown.breakdownNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/trucks/${breakdown.truck.id}`}
                        className="font-medium hover:underline"
                      >
                        {breakdown.truck.truckNumber}
                      </Link>
                      {breakdown.load && (
                        <div className="text-sm text-muted-foreground">
                          Load: {breakdown.load.loadNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{breakdown.breakdownType.replace(/_/g, ' ')}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(breakdown.status)}>
                        {formatStatus(breakdown.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getPriorityColor(breakdown.priority)}>
                        {breakdown.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{breakdown.location}</TableCell>
                    <TableCell>{formatDate(breakdown.reportedAt)}</TableCell>
                    <TableCell className="font-medium">
                      {breakdown.totalCost ? formatCurrency(breakdown.totalCost) : '-'}
                    </TableCell>
                    <TableCell>
                      {breakdown.downtimeHours
                        ? `${breakdown.downtimeHours.toFixed(1)} hrs`
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total} breakdowns
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

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <BulkActionBar
              selectedIds={selectedIds}
              onClearSelection={() => setSelectedIds([])}
              entityType="breakdown"
              onActionComplete={() => {
                refetch();
                setSelectedIds([]);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

