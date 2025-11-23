'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Truck, Search, Download, Upload, Plus, Edit, Trash2, AlertTriangle, TrendingUp, Settings2 } from 'lucide-react';
import { formatDate, apiUrl } from '@/lib/utils';
import ImportButton from '@/components/import-export/ImportButton';
import ExportDialog from '@/components/import-export/ExportDialog';
import AdvancedFilters from '@/components/filters/AdvancedFilters';
import SavedFilters from '@/components/filters/SavedFilters';
import Link from 'next/link';
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
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

interface Trailer {
  id: string;
  trailerNumber: string;
  vin: string | null;
  make: string;
  model: string;
  year: number | null;
  licensePlate: string | null;
  state: string | null;
  mcNumber: string | null; // MC number as string (extracted from relation)
  mcNumberId?: string; // MC number ID (optional, for reference)
  mcNumberRecord?: { // Full MC number record (optional)
    id: string;
    number: string;
    companyName: string;
  } | null;
  type: string | null;
  ownership: string | null;
  ownerName: string | null;
  status: string | null;
  fleetStatus: string | null;
  assignedTruck: {
    id: string;
    truckNumber: string;
  } | null;
  operatorDriver: {
    id: string;
    driverNumber: string;
    name: string;
  } | null;
  loadCount: number;
  activeLoads: number;
  lastUsed: Date | null;
  registrationExpiry: Date | null;
  insuranceExpiry: Date | null;
  inspectionExpiry: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

async function fetchTrailers(params: {
  page?: number;
  limit?: number;
  search?: string;
  mc?: string | null;
  [key: string]: any;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.mc) queryParams.set('mc', params.mc);

  const response = await fetch(apiUrl(`/api/trailers?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch trailers');
  return response.json();
}

async function deleteTrailer(id: string) {
  const response = await fetch(apiUrl(`/api/trailers/${id}`), {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete trailer');
  }
  return response.json();
}

async function bulkDeleteTrailers(trailerIds: string[]) {
  const response = await fetch(apiUrl('/api/trailers/bulk'), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trailerIds }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete trailers');
  }
  return response.json();
}

export default function TrailerList() {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const mcParam = searchParams?.get('mc');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trailerToDelete, setTrailerToDelete] = useState<Trailer | null>(null);
  const [selectedTrailerIds, setSelectedTrailerIds] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    checkbox: true,
    trailerNumber: true,
    vehicle: true,
    licensePlate: true,
    assignedTruck: true,
    totalLoads: true,
    activeLoads: true,
    breakdowns: true,
    lastUsed: false,
    status: true,
    actions: true,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['trailers', page, searchQuery, mcParam, JSON.stringify(advancedFilters)],
    queryFn: () =>
      fetchTrailers({
        page,
        limit: 20,
        search: searchQuery || undefined,
        mc: mcParam || undefined,
        ...advancedFilters,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTrailer,
    onSuccess: () => {
      toast.success('Trailer deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['trailers'] });
      setDeleteDialogOpen(false);
      setTrailerToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete trailer');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteTrailers,
    onSuccess: (data) => {
      const deletedCount = data.data?.deleted || selectedTrailerIds.length;
      const skippedCount = data.data?.skipped || 0;
      const message = skippedCount > 0
        ? `Deleted ${deletedCount} trailer(s). ${skippedCount} trailer(s) skipped due to active loads.`
        : `Successfully deleted ${deletedCount} trailer(s)`;
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['trailers'] });
      setSelectedTrailerIds([]);
      setBulkDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete trailers');
    },
  });

  const trailers: Trailer[] = data?.data || [];
  const meta = data?.meta;

  // Fetch breakdown stats for trailers
  const { data: breakdownStatsData } = useQuery({
    queryKey: ['trailerBreakdownStats'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/fleet/trailers/breakdown-stats'));
      if (!response.ok) throw new Error('Failed to fetch breakdown stats');
      return response.json();
    },
  });

  const breakdownStats = breakdownStatsData?.data || {};

  const handleDeleteClick = (trailer: Trailer) => {
    setTrailerToDelete(trailer);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (trailerToDelete) {
      deleteMutation.mutate(trailerToDelete.id);
    }
  };

  const handleBulkDeleteConfirm = () => {
    if (selectedTrailerIds.length > 0) {
      bulkDeleteMutation.mutate(selectedTrailerIds);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTrailerIds(trailers.map((trailer) => trailer.id));
    } else {
      setSelectedTrailerIds([]);
    }
  };

  const handleSelectTrailer = (trailerId: string, checked: boolean) => {
    if (checked) {
      setSelectedTrailerIds([...selectedTrailerIds, trailerId]);
    } else {
      setSelectedTrailerIds(selectedTrailerIds.filter((id) => id !== trailerId));
    }
  };

  const allSelected = trailers.length > 0 && selectedTrailerIds.length === trailers.length;
  const someSelected = selectedTrailerIds.length > 0 && selectedTrailerIds.length < trailers.length;

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading trailers</p>
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
          <p className="text-sm text-muted-foreground">Manage trailer fleet and assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings2 className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 max-h-[400px] overflow-y-auto">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={visibleColumns.checkbox}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, checkbox: checked })
                }
              >
                Checkbox
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.trailerNumber}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, trailerNumber: checked })
                }
              >
                Trailer Number
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.vehicle}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, vehicle: checked })
                }
              >
                Vehicle
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.licensePlate}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, licensePlate: checked })
                }
              >
                License Plate
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.assignedTruck}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, assignedTruck: checked })
                }
              >
                Assigned Truck
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.totalLoads}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, totalLoads: checked })
                }
              >
                Total Loads
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.activeLoads}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, activeLoads: checked })
                }
              >
                Active Loads
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.breakdowns}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, breakdowns: checked })
                }
              >
                Breakdowns
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.lastUsed}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, lastUsed: checked })
                }
              >
                Last Used
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.status}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, status: checked })
                }
              >
                Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.actions}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, actions: checked })
                }
              >
                Actions
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {can('trucks.create') && (
            <Link href="/dashboard/trailers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Trailer
              </Button>
            </Link>
          )}
          <ImportButton entityType="trailers" />
          <ExportDialog entityType="trailers" />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by trailer number, VIN, make, model..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <AdvancedFilters
            filters={[
              { field: 'status', label: 'Status', type: 'text' },
              { field: 'fleetStatus', label: 'Fleet Status', type: 'text' },
              { field: 'type', label: 'Type', type: 'text' },
              { field: 'ownership', label: 'Ownership', type: 'text' },
              { field: 'state', label: 'State', type: 'text' },
              { field: 'make', label: 'Make', type: 'text' },
              { field: 'model', label: 'Model', type: 'text' },
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
            entityType="trailers"
            currentFilters={{ ...advancedFilters, search: searchQuery }}
            onApplyFilter={(filters) => {
              const { search, ...rest } = filters;
              if (search) setSearchQuery(search);
              setAdvancedFilters(rest);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTrailerIds.length > 0 && can('trucks.delete') && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedTrailerIds.length} trailer(s) selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkDeleteDialogOpen(true)}
            disabled={bulkDeleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedTrailerIds([])}
          >
            Clear
          </Button>
        </div>
      )}


      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading trailers...</div>
        </div>
      ) : trailers.length === 0 ? (
        <div className="flex items-center justify-center h-96 border rounded-lg">
          <div className="text-center">
            <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No trailers found</p>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search query
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {can('trucks.delete') && visibleColumns.checkbox && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all trailers"
                      />
                    </TableHead>
                  )}
                  {visibleColumns.trailerNumber && <TableHead>Trailer Number</TableHead>}
                  {visibleColumns.vehicle && <TableHead>Vehicle</TableHead>}
                  {visibleColumns.licensePlate && <TableHead>License Plate</TableHead>}
                  {visibleColumns.assignedTruck && <TableHead>Assigned Truck</TableHead>}
                  {visibleColumns.totalLoads && <TableHead>Total Loads</TableHead>}
                  {visibleColumns.activeLoads && <TableHead>Active Loads</TableHead>}
                  {visibleColumns.breakdowns && <TableHead>Breakdowns</TableHead>}
                  {visibleColumns.lastUsed && <TableHead>Last Used</TableHead>}
                  {visibleColumns.status && <TableHead>Status</TableHead>}
                  {visibleColumns.actions && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {trailers.map((trailer) => (
                  <TableRow key={trailer.id}>
                    {can('trucks.delete') && visibleColumns.checkbox && (
                      <TableCell className="w-12">
                        <Checkbox
                          checked={selectedTrailerIds.includes(trailer.id)}
                          onCheckedChange={(checked) => handleSelectTrailer(trailer.id, checked as boolean)}
                          aria-label={`Select trailer ${trailer.trailerNumber}`}
                        />
                      </TableCell>
                    )}
                    {visibleColumns.trailerNumber && (
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/trailers/${trailer.id}`}
                          className="text-primary hover:underline"
                        >
                          {trailer.trailerNumber}
                        </Link>
                      </TableCell>
                    )}
                    {visibleColumns.vehicle && (
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {trailer.year ? `${trailer.year} ` : ''}
                            {trailer.make} {trailer.model}
                          </div>
                          {trailer.vin && (
                            <div className="text-sm text-muted-foreground">
                              VIN: {trailer.vin.slice(0, 8)}...
                            </div>
                          )}
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.licensePlate && (
                      <TableCell>
                        {trailer.licensePlate ? (
                          <div>
                            <div className="font-medium">{trailer.licensePlate}</div>
                            {trailer.state && (
                              <div className="text-sm text-muted-foreground">{trailer.state}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.assignedTruck && (
                      <TableCell>
                        {trailer.assignedTruck ? (
                          <Link
                            href={`/dashboard/trucks/${trailer.assignedTruck.id}`}
                            className="text-primary hover:underline"
                          >
                            {trailer.assignedTruck.truckNumber}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.totalLoads && <TableCell>{trailer.loadCount}</TableCell>}
                    {visibleColumns.activeLoads && (
                      <TableCell>
                        {trailer.activeLoads > 0 ? (
                          <Badge variant="destructive">{trailer.activeLoads}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.breakdowns && (
                      <TableCell>
                        {breakdownStats[trailer.id]?.breakdownCount > 0 ? (
                          <Badge variant="destructive">
                            {breakdownStats[trailer.id].breakdownCount}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.lastUsed && (
                      <TableCell>
                        {trailer.lastUsed ? formatDate(trailer.lastUsed) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.status && (
                      <TableCell>
                        {trailer.status ? (
                          <Badge variant="outline">{trailer.status}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.actions && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {can('trucks.edit') && (
                            <Link href={`/dashboard/trailers/${trailer.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {can('trucks.delete') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(trailer)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
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
                {Math.min(page * 20, meta.total)} of {meta.total} trailers
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {meta.totalPages}
                  </span>
                </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trailer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete trailer{' '}
              <strong>{trailerToDelete?.trailerNumber}</strong>? This action cannot be undone.
              {trailerToDelete && trailerToDelete.activeLoads > 0 && (
                <span className="block mt-2 text-destructive">
                  Warning: This trailer has {trailerToDelete.activeLoads} active load(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Trailers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedTrailerIds.length}</strong> selected trailer(s)? This action cannot be undone.
              <span className="block mt-2 text-muted-foreground">
                Trailers with active loads will be skipped automatically.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
