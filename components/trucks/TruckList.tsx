'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Truck, Plus, Search, Filter } from 'lucide-react';
import { TruckStatus } from '@prisma/client';
import AdvancedFilters from '@/components/filters/AdvancedFilters';
import SavedFilters from '@/components/filters/SavedFilters';
import TruckListStats from '@/components/trucks/TruckListStats';
import TruckQuickView from '@/components/trucks/TruckQuickView';
import { useKeyboardShortcuts, commonShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { usePermissions } from '@/hooks/usePermissions';
import ImportDialog from '@/components/import-export/ImportDialog';
import ExportDialog from '@/components/import-export/ExportDialog';
import BulkActionBar from '@/components/import-export/BulkActionBar';
import { Checkbox } from '@/components/ui/checkbox';

interface TruckData {
  id: string;
  truckNumber: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  state: string;
  equipmentType: string;
  status: TruckStatus;
  currentDrivers: Array<{
    id: string;
    driverNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  }>;
  odometerReading: number;
}

const statusColors: Record<TruckStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  IN_USE: 'bg-blue-100 text-blue-800 border-blue-200',
  MAINTENANCE: 'bg-orange-100 text-orange-800 border-orange-200',
  OUT_OF_SERVICE: 'bg-red-100 text-red-800 border-red-200',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
};

function formatStatus(status: TruckStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatEquipmentType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function fetchTrucks(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  [key: string]: any;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.status) queryParams.set('status', params.status);
  if (params.search) queryParams.set('search', params.search);
  
  // Add advanced filters
  Object.keys(params).forEach((key) => {
    if (!['page', 'limit', 'status', 'search'].includes(key) && params[key]) {
      queryParams.set(key, params[key].toString());
    }
  });

  const response = await fetch(`/api/trucks?${queryParams}`);
  if (!response.ok) throw new Error('Failed to fetch trucks');
  return response.json();
}

export default function TruckList() {
  const { can } = usePermissions();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);
  const [quickViewTruckId, setQuickViewTruckId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['trucks', page, statusFilter, searchQuery, advancedFilters],
    queryFn: () =>
      fetchTrucks({
        page,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
        ...advancedFilters,
      }),
  });

  const trucks: TruckData[] = data?.data || [];
  const meta = data?.meta;

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...commonShortcuts.newLoad,
      action: () => {
        window.location.href = '/dashboard/trucks/new';
      },
    },
    {
      ...commonShortcuts.search,
      action: () => {
        searchInputRef?.focus();
      },
    },
    {
      ...commonShortcuts.refresh,
      action: () => {
        refetch();
      },
    },
  ]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Trucks</h1>
          <p className="text-muted-foreground">
            Manage your truck fleet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportDialog entityType="trucks" onImportComplete={() => refetch()} />
          <ExportDialog entityType="trucks" />
          {can('trucks.create') && (
            <Link href="/dashboard/trucks/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Truck
              </Button>
            </Link>
          )}
        </div>
      </div>

      <TruckListStats filters={{ ...advancedFilters, status: statusFilter, search: searchQuery }} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={setSearchInputRef}
            placeholder="Search by truck number, VIN, or make/model... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.keys(statusColors).map((status) => (
              <SelectItem key={status} value={status}>
                {formatStatus(status as TruckStatus)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 flex-wrap">
          <AdvancedFilters
            filters={[
              { field: 'make', label: 'Make', type: 'text' },
              { field: 'model', label: 'Model', type: 'text' },
              { field: 'equipmentType', label: 'Equipment Type', type: 'text' },
              { field: 'licenseState', label: 'License State', type: 'text' },
            ]}
            onApply={(filters) => {
              setAdvancedFilters(filters);
              setPage(1);
            }}
            onClear={() => {
              setAdvancedFilters({});
              setPage(1);
            }}
          />
          <SavedFilters
            entityType="trucks"
            currentFilters={{ ...advancedFilters, status: statusFilter, search: searchQuery }}
            onApply={(filters) => {
              const { status, search, ...rest } = filters;
              if (status) setStatusFilter(status);
              if (search) setSearchQuery(search);
              setAdvancedFilters(rest);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading trucks...</div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          Error loading trucks. Please try again.
        </div>
      ) : trucks.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No trucks found</p>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding your first truck'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link href="/dashboard/trucks/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Truck
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Truck #</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trucks.map((truck) => (
                  <TableRow key={truck.id}>
                    <TableCell className="font-medium">
                      <button
                        onClick={() => setQuickViewTruckId(truck.id)}
                        className="text-primary hover:underline text-left"
                      >
                        {truck.truckNumber}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {truck.year} {truck.make} {truck.model}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {truck.vin ? `VIN: ${truck.vin.slice(0, 8)}...` : ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {truck.licensePlate} ({truck.state})
                    </TableCell>
                    <TableCell>
                      {formatEquipmentType(truck.equipmentType)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[truck.status]}
                      >
                        {formatStatus(truck.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {truck.currentDrivers && truck.currentDrivers.length > 0 ? (
                        <div>
                          {truck.currentDrivers.map((driver) => (
                            <Link
                              key={driver.id}
                              href={`/dashboard/drivers/${driver.id}`}
                              className="text-primary hover:underline block"
                            >
                              {driver.user.firstName} {driver.user.lastName}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {truck.odometerReading.toLocaleString()} mi
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/trucks/${truck.id}`}>
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
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1} to{' '}
                {Math.min(page * 20, meta.total)} of {meta.total} trucks
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <TruckQuickView
        truckId={quickViewTruckId}
        open={!!quickViewTruckId}
        onOpenChange={(open) => {
          if (!open) setQuickViewTruckId(null);
        }}
      />
    </div>
  );
}

