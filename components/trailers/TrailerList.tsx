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
import { Truck, Search, Download, Upload, Plus, Edit, Trash2 } from 'lucide-react';
import { formatDate, apiUrl } from '@/lib/utils';
import ImportButton from '@/components/import-export/ImportButton';
import ExportDialog from '@/components/import-export/ExportDialog';
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
  mcNumber: string | null;
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

export default function TrailerList() {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const mcParam = searchParams?.get('mc');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trailerToDelete, setTrailerToDelete] = useState<Trailer | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['trailers', page, searchQuery, mcParam],
    queryFn: () =>
      fetchTrailers({
        page,
        limit: 20,
        search: searchQuery || undefined,
        mc: mcParam || undefined,
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

  const trailers: Trailer[] = data?.data || [];
  const meta = data?.meta;

  const handleDeleteClick = (trailer: Trailer) => {
    setTrailerToDelete(trailer);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (trailerToDelete) {
      deleteMutation.mutate(trailerToDelete.id);
    }
  };

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
          <h1 className="text-2xl font-bold">Trailers</h1>
          <p className="text-sm text-muted-foreground">Manage trailer fleet and assignments</p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by trailer number, VIN, make, model..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1); // Reset to first page on search
          }}
          className="pl-10"
        />
      </div>

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
                  <TableHead>Trailer Number</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Assigned Truck</TableHead>
                  <TableHead>Total Loads</TableHead>
                  <TableHead>Active Loads</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trailers.map((trailer) => (
                  <TableRow key={trailer.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/trailers/${trailer.id}`}
                        className="text-primary hover:underline"
                      >
                        {trailer.trailerNumber}
                      </Link>
                    </TableCell>
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
                    <TableCell>{trailer.loadCount}</TableCell>
                    <TableCell>
                      {trailer.activeLoads > 0 ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {trailer.activeLoads} Active
                        </Badge>
                      ) : (
                        <Badge variant="outline">Available</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {trailer.lastUsed ? formatDate(trailer.lastUsed) : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={trailer.activeLoads > 0 ? 'default' : 'outline'}
                        className={trailer.activeLoads > 0 ? 'bg-green-600' : ''}
                      >
                        {trailer.activeLoads > 0 ? 'In Use' : 'Available'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/trailers/${trailer.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                        {can('trucks.edit') && (
                          <Link href={`/dashboard/trailers/${trailer.id}`}>
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
                            disabled={trailer.activeLoads > 0}
                            title={trailer.activeLoads > 0 ? 'Cannot delete trailer with active loads' : 'Delete trailer'}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
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
    </div>
  );
}
