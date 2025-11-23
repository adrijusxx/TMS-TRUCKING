'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Wrench, Plus, Search, Filter, Download, Upload } from 'lucide-react';
import { formatDate, formatCurrency, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import ImportDialog from '@/components/import-export/ImportDialog';
import ExportDialog from '@/components/import-export/ExportDialog';
import BulkActionBar from '@/components/import-export/BulkActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

interface MaintenanceRecord {
  id: string;
  type: string;
  description: string;
  cost: number;
  mileage: number;
  scheduledDate: Date | null;
  completedDate: Date | null;
  vendor: string | null;
  invoiceNumber: string | null;
  truck: {
    id: string;
    truckNumber: string;
    make: string;
    model: string;
  };
  createdAt: Date;
}

async function fetchMaintenance(params: {
  page?: number;
  limit?: number;
  truckId?: string;
  type?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.truckId) queryParams.set('truckId', params.truckId);
  if (params.type) queryParams.set('type', params.type);

  const response = await fetch(apiUrl(`/api/maintenance?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch maintenance records');
  return response.json();
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    OIL_CHANGE: 'bg-blue-100 text-blue-800',
    REPAIR: 'bg-red-100 text-red-800',
    INSPECTION: 'bg-green-100 text-green-800',
    PMI: 'bg-purple-100 text-purple-800',
    ENGINE: 'bg-orange-100 text-orange-800',
    TRANSMISSION: 'bg-yellow-100 text-yellow-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

export default function MaintenanceList() {
  const [page, setPage] = useState(1);
  const [truckFilter, setTruckFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['maintenance', page, truckFilter, typeFilter],
    queryFn: () =>
      fetchMaintenance({
        page,
        limit: 20,
        truckId: truckFilter !== 'all' ? truckFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
      }),
  });

  const records: MaintenanceRecord[] = data?.data?.records || [];
  const pagination = data?.data?.pagination;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === records.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map((r) => r.id));
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading maintenance records</p>
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
          <p className="text-sm text-muted-foreground">Manage vehicle maintenance schedules and history</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportDialog entityType="maintenance" onImportComplete={() => refetch()} />
          <ExportDialog entityType="maintenance" />
          <Link href="/dashboard/maintenance/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Maintenance
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
            <SelectItem value="OIL_CHANGE">Oil Change</SelectItem>
            <SelectItem value="TIRE_ROTATION">Tire Rotation</SelectItem>
            <SelectItem value="BRAKE_SERVICE">Brake Service</SelectItem>
            <SelectItem value="INSPECTION">Inspection</SelectItem>
            <SelectItem value="REPAIR">Repair</SelectItem>
            <SelectItem value="PMI">PMI</SelectItem>
            <SelectItem value="ENGINE">Engine</SelectItem>
            <SelectItem value="TRANSMISSION">Transmission</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading maintenance records...</div>
        </div>
      ) : records.length === 0 ? (
        <div className="flex items-center justify-center h-96 border rounded-lg">
          <div className="text-center">
            <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No maintenance records found</p>
            <Link href="/dashboard/maintenance/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Maintenance Record
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
                      checked={selectedIds.length === records.length && records.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Mileage</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Vendor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(record.id)}
                        onCheckedChange={() => toggleSelect(record.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/trucks/${record.truck.id}`}
                        className="font-medium hover:underline"
                      >
                        {record.truck.truckNumber}
                      </Link>
                      <div className="text-sm text-muted-foreground">
                        {record.truck.make} {record.truck.model}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(record.type)}>
                        {formatType(record.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.description}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(record.cost)}</TableCell>
                    <TableCell>{record.mileage.toLocaleString()} mi</TableCell>
                    <TableCell>
                      {record.scheduledDate ? formatDate(record.scheduledDate) : '-'}
                    </TableCell>
                    <TableCell>
                      {record.completedDate ? formatDate(record.completedDate) : '-'}
                    </TableCell>
                    <TableCell>{record.vendor || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total} records
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
              entityType="maintenance"
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

