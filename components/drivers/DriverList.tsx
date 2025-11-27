'use client';

import { useState, useEffect } from 'react';
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
import { Users, Plus, Search, Filter, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { DriverStatus, PayType } from '@prisma/client';
import { usePermissions } from '@/hooks/usePermissions';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import AdvancedFilters from '@/components/filters/AdvancedFilters';
import SavedFilters from '@/components/filters/SavedFilters';
import { ShowDeletedToggle } from '@/components/common/ShowDeletedToggle';
import { DeletedRecordBadge } from '@/components/common/DeletedRecordBadge';
import DriverListStats from '@/components/drivers/DriverListStats';
import DriverQuickView from '@/components/drivers/DriverQuickView';
import DriverExpandedEdit from '@/components/drivers/DriverExpandedEdit';
import { useKeyboardShortcuts, commonShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import ImportButton from '@/components/import-export/ImportButton';
import ExportDialog from '@/components/import-export/ExportDialog';
import McBadge from '@/components/mc-numbers/McBadge';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate, formatCurrency, apiUrl } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Driver {
  id: string;
  driverNumber: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: Date;
  medicalCardExpiry: Date;
  drugTestDate: Date | null;
  backgroundCheck: Date | null;
  status: DriverStatus;
  homeTerminal: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  payType: PayType;
  payRate: number;
  perDiem?: number | null;
  escrowTargetAmount?: number | null;
  escrowDeductionPerWeek?: number | null;
  escrowBalance?: number | null;
  rating: number | null;
  totalLoads: number;
  totalMiles: number;
  onTimePercentage: number;
  deletedAt?: Date | null; // For admin visibility
  isActive?: boolean;
  mcNumber?: {
    number: string;
    companyName: string;
  } | null;
  currentTruck?: {
    id: string;
    truckNumber: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

const statusColors: Record<DriverStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  ON_DUTY: 'bg-blue-100 text-blue-800 border-blue-200',
  DRIVING: 'bg-purple-100 text-purple-800 border-purple-200',
  OFF_DUTY: 'bg-gray-100 text-gray-800 border-gray-200',
  SLEEPER_BERTH: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  ON_LEAVE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  INACTIVE: 'bg-red-100 text-red-800 border-red-200',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DISPATCHED: 'bg-cyan-100 text-cyan-800 border-cyan-200',
};

function formatStatus(status: DriverStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatPayType(payType: PayType): string {
  return payType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function deleteDriver(driverId: string) {
  const response = await fetch(apiUrl(`/api/drivers/${driverId}`), {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete driver');
  }
  return response.json();
}

async function bulkDeleteDrivers(driverIds: string[]) {
  const response = await fetch(apiUrl('/api/drivers/bulk'), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverIds }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete drivers');
  }
  return response.json();
}

async function fetchDrivers(params: {
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

  const response = await fetch(apiUrl(`/api/drivers?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch drivers');
  return response.json();
}

export default function DriverList() {
  const { can } = usePermissions();
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);
  const [quickViewDriverId, setQuickViewDriverId] = useState<string | null>(null);
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
  const [deleteDriverId, setDeleteDriverId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [editDriverId, setEditDriverId] = useState<string | null>(null);
  const [expandedDriverIds, setExpandedDriverIds] = useState<Set<string>>(new Set());

  // Get includeDeleted from URL params (admins only)
  const [includeDeleted, setIncludeDeleted] = useState(false);
  
  // Check URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIncludeDeleted(params.get('includeDeleted') === 'true');
  }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['drivers', page, statusFilter, searchQuery, advancedFilters, includeDeleted],
    queryFn: () =>
      fetchDrivers({
        page,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
        ...advancedFilters,
        ...(isAdmin && includeDeleted && { includeDeleted: 'true' }),
      }),
  });

  const drivers: Driver[] = data?.data || [];
  const meta = data?.meta;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver deleted successfully');
      setDeleteDriverId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete driver');
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteDrivers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success(`Deleted ${selectedDriverIds.length} driver(s) successfully`);
      setSelectedDriverIds([]);
      setBulkDeleteOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete drivers');
    },
  });

  const handleSelectDriver = (driverId: string, checked: boolean) => {
    if (checked) {
      setSelectedDriverIds([...selectedDriverIds, driverId]);
    } else {
      setSelectedDriverIds(selectedDriverIds.filter((id) => id !== driverId));
    }
  };

  const toggleDriverExpansion = (driverId: string) => {
    setExpandedDriverIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(driverId)) {
        newSet.delete(driverId);
      } else {
        newSet.add(driverId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDriverIds(drivers.map((d) => d.id));
    } else {
      setSelectedDriverIds([]);
    }
  };

  const allSelected = drivers.length > 0 && selectedDriverIds.length === drivers.length;
  const someSelected = selectedDriverIds.length > 0 && selectedDriverIds.length < drivers.length;

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...commonShortcuts.newLoad,
      action: () => {
        window.location.href = '/dashboard/drivers/new';
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
          <h1 className="text-3xl font-bold">Drivers</h1>
        </div>
        <div className="flex gap-2">
          <ImportButton entityType="drivers" />
          <ExportDialog entityType="drivers" />
          {can('drivers.create') && (
            <Link href="/dashboard/drivers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Driver
              </Button>
            </Link>
          )}
        </div>
      </div>

      <DriverListStats filters={{ ...advancedFilters, status: statusFilter, search: searchQuery }} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={setSearchInputRef}
            placeholder="Search by name or driver number... (Ctrl+K)"
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
                {formatStatus(status as DriverStatus)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 flex-wrap">
          <AdvancedFilters
            filters={[
              { field: 'licenseState', label: 'License State', type: 'text' },
              { field: 'homeTerminal', label: 'Home Terminal', type: 'text' },
              { field: 'minRating', label: 'Min Rating', type: 'number' },
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
            entityType="drivers"
            currentFilters={{ ...advancedFilters, status: statusFilter, search: searchQuery }}
            onApplyFilter={(filters) => {
              const { status, search, ...rest } = filters;
              if (status) setStatusFilter(status);
              if (search) setSearchQuery(search);
              setAdvancedFilters(rest);
              setPage(1);
            }}
          />
          {isAdmin && (
            <ShowDeletedToggle className="ml-2" />
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading drivers...</div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          Error loading drivers. Please try again.
        </div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No drivers found</p>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding your first driver'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link href="/dashboard/drivers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Driver
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Bulk Actions Bar */}
          {selectedDriverIds.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium">
                {selectedDriverIds.length} driver(s) selected
              </div>
              <div className="flex gap-2">
                {can('drivers.delete') && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBulkDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete {selectedDriverIds.length}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDriverIds([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  {can('drivers.delete') && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all drivers"
                      />
                    </TableHead>
                  )}
                  <TableHead>Driver #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>License Expiry</TableHead>
                  <TableHead>Medical Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pay Type</TableHead>
                  <TableHead>Pay Rate</TableHead>
                  <TableHead>Home Terminal</TableHead>
                  <TableHead>Emergency Contact</TableHead>
                  <TableHead>Current Truck</TableHead>
                  <TableHead>Total Loads</TableHead>
                  <TableHead>Total Miles</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver) => {
                  const isExpanded = expandedDriverIds.has(driver.id);
                  // Count: 1 expand + (1 checkbox if can delete) + 16 other columns = 17 or 18
                  const columnCount = 1 + (can('drivers.delete') ? 1 : 0) + 16;
                  return (
                    <>
                      <TableRow key={driver.id} className={isExpanded ? 'bg-muted/30' : ''}>
                        <TableCell className="w-12">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDriverExpansion(driver.id);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        {can('drivers.delete') && (
                          <TableCell>
                            <Checkbox
                              checked={selectedDriverIds.includes(driver.id)}
                              onCheckedChange={(checked) =>
                                handleSelectDriver(driver.id, checked as boolean)
                              }
                              aria-label={`Select driver ${driver.driverNumber}`}
                            />
                          </TableCell>
                        )}
                    <TableCell className="font-medium">
                      <button
                        onClick={() => setQuickViewDriverId(driver.id)}
                        className="text-primary hover:underline text-left"
                      >
                        {driver.driverNumber}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2 flex-wrap">
                          <span>{driver.user.firstName} {driver.user.lastName}</span>
                          {driver.mcNumber && (
                            <McBadge 
                              mcNumber={driver.mcNumber.number} 
                              companyName={driver.mcNumber.companyName}
                              size="sm" 
                            />
                          )}
                          <DeletedRecordBadge deletedAt={driver.deletedAt} />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {driver.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {driver.user.phone || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{driver.licenseNumber}</div>
                        <div className="text-muted-foreground">{driver.licenseState}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(driver.licenseExpiry)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(driver.medicalCardExpiry)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[driver.status as DriverStatus]}
                      >
                        {formatStatus(driver.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPayType(driver.payType)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatCurrency(driver.payRate)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {driver.homeTerminal || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {driver.emergencyContact ? (
                        <div className="text-sm">
                          <div>{driver.emergencyContact}</div>
                          {driver.emergencyPhone && (
                            <div className="text-muted-foreground text-xs">
                              {driver.emergencyPhone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {driver.currentTruck ? (
                        <Link
                          href={`/dashboard/trucks/${driver.currentTruck.id}`}
                          className="text-primary hover:underline"
                        >
                          {driver.currentTruck.truckNumber}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>{driver.totalLoads}</TableCell>
                    <TableCell>
                      {driver.totalMiles.toLocaleString()} mi
                    </TableCell>
                    <TableCell>
                      {driver.rating ? (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{driver.rating.toFixed(1)}</span>
                          <span className="text-muted-foreground">/ 5.0</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {can('drivers.edit') && (
                          <Link href={`/dashboard/drivers/${driver.id}`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        {can('drivers.delete') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDriverId(driver.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={columnCount} className="p-0">
                        <DriverExpandedEdit
                          driverId={driver.id}
                          onSave={() => {
                            toggleDriverExpansion(driver.id);
                            refetch();
                          }}
                          onCancel={() => toggleDriverExpansion(driver.id)}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1} to{' '}
                {Math.min(page * 20, meta.total)} of {meta.total} drivers
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

      <DriverQuickView
        driverId={quickViewDriverId}
        open={!!quickViewDriverId}
        onOpenChange={(open) => {
          if (!open) setQuickViewDriverId(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDriverId} onOpenChange={(open) => !open && setDeleteDriverId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete the driver. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDriverId) {
                  deleteMutation.mutate(deleteDriverId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete {selectedDriverIds.length} driver(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                bulkDeleteMutation.mutate(selectedDriverIds);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? 'Deleting...' : `Delete ${selectedDriverIds.length} Driver(s)`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

