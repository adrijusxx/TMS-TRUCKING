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
import { ClipboardCheck, Plus, Filter, Download, Upload } from 'lucide-react';
import { formatDate, apiUrl } from '@/lib/utils';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import BulkActionBar from '@/components/import-export/BulkActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

interface Inspection {
  id: string;
  inspectionNumber: string;
  inspectionType: string;
  inspectionDate: Date;
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
    driverNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  nextInspectionDue?: Date | null;
}

async function fetchInspections(params: {
  page?: number;
  limit?: number;
  truckId?: string;
  inspectionType?: string;
  status?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.truckId) queryParams.set('truckId', params.truckId);
  if (params.inspectionType) queryParams.set('inspectionType', params.inspectionType);
  if (params.status) queryParams.set('status', params.status);

  const response = await fetch(apiUrl(`/api/inspections?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch inspections');
  return response.json();
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PASSED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    CONDITIONAL: 'bg-yellow-100 text-yellow-800',
    OUT_OF_SERVICE: 'bg-red-100 text-red-800',
    PENDING: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export default function InspectionList() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['inspections', page, typeFilter, statusFilter],
    queryFn: () =>
      fetchInspections({
        page,
        limit: 20,
        inspectionType: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  });

  const inspections: Inspection[] = data?.data?.inspections || [];
  const pagination = data?.data?.pagination;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === inspections.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(inspections.map((i) => i.id));
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading inspections</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Manage vehicle inspections and compliance</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportSheet
            entityType="inspections"
            onImportComplete={() => refetch()}
          >
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </ImportSheet>
          <ExportDialog entityType="inspections" />
          <Link href="/dashboard/inspections/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Inspection
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="DOT_ANNUAL">DOT Annual</SelectItem>
            <SelectItem value="DOT_LEVEL_1">DOT Level 1</SelectItem>
            <SelectItem value="DOT_LEVEL_2">DOT Level 2</SelectItem>
            <SelectItem value="DOT_LEVEL_3">DOT Level 3</SelectItem>
            <SelectItem value="DOT_PRE_TRIP">DOT Pre-Trip</SelectItem>
            <SelectItem value="DOT_POST_TRIP">DOT Post-Trip</SelectItem>
            <SelectItem value="STATE_INSPECTION">State Inspection</SelectItem>
            <SelectItem value="COMPANY_INSPECTION">Company Inspection</SelectItem>
            <SelectItem value="PMI">PMI</SelectItem>
            <SelectItem value="SAFETY_INSPECTION">Safety Inspection</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
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

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading inspections...</div>
        </div>
      ) : inspections.length === 0 ? (
        <div className="flex items-center justify-center h-96 border rounded-lg">
          <div className="text-center">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No inspections found</p>
            <Link href="/dashboard/inspections/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Inspection
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
                      checked={selectedIds.length === inspections.length && inspections.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Inspection #</TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Defects</TableHead>
                  <TableHead>OOS</TableHead>
                  <TableHead>Next Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspections.map((inspection) => (
                  <TableRow key={inspection.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(inspection.id)}
                        onCheckedChange={() => toggleSelect(inspection.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/inspections/${inspection.id}`}
                        className="font-medium hover:underline"
                      >
                        {inspection.inspectionNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/trucks/${inspection.truck.id}`}
                        className="font-medium hover:underline"
                      >
                        {inspection.truck.truckNumber}
                      </Link>
                      <div className="text-sm text-muted-foreground">
                        {inspection.truck.make} {inspection.truck.model}
                      </div>
                    </TableCell>
                    <TableCell>{formatType(inspection.inspectionType)}</TableCell>
                    <TableCell>{formatDate(inspection.inspectionDate)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(inspection.status)}>
                        {inspection.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{inspection.defects}</TableCell>
                    <TableCell>
                      {inspection.oosStatus ? (
                        <Badge variant="destructive">OOS</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {inspection.nextInspectionDue
                        ? formatDate(inspection.nextInspectionDue)
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
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total} inspections
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
              entityType="inspection"
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

