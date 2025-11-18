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
import { Input } from '@/components/ui/input';
import { MapPin, Plus, Search, Download, Upload } from 'lucide-react';
import ImportDialog from '@/components/import-export/ImportDialog';
import ExportDialog from '@/components/import-export/ExportDialog';
import BulkActionBar from '@/components/import-export/BulkActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { apiUrl } from '@/lib/utils';

interface Location {
  id: string;
  locationNumber: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  contactName?: string | null;
  contactPhone?: string | null;
  pickupCount: number;
  deliveryCount: number;
}

async function fetchLocations(params: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.type) queryParams.set('type', params.type);

  const response = await fetch(apiUrl(`/api/locations?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch locations');
  return response.json();
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function LocationList() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['locations', page, searchQuery],
    queryFn: () =>
      fetchLocations({
        page,
        limit: 20,
        search: searchQuery || undefined,
      }),
  });

  const locations: Location[] = data?.data?.locations || [];
  const pagination = data?.data?.pagination;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === locations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(locations.map((l) => l.id));
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading locations</p>
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
          <h1 className="text-3xl font-bold">Locations</h1>
          <p className="text-muted-foreground">Manage frequently used pickup and delivery locations</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportDialog entityType="locations" onImportComplete={() => refetch()} />
          <ExportDialog entityType="locations" />
          <Link href="/dashboard/locations/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Location
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by location number, name, address..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="pl-10"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading locations...</div>
        </div>
      ) : locations.length === 0 ? (
        <div className="flex items-center justify-center h-96 border rounded-lg">
          <div className="text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No locations found</p>
            <Link href="/dashboard/locations/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
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
                      checked={selectedIds.length === locations.length && locations.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Location #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>City, State</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Usage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(location.id)}
                        onCheckedChange={() => toggleSelect(location.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{location.locationNumber}</TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/locations/${location.id}`}
                        className="font-medium hover:underline"
                      >
                        {location.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatType(location.type)}</Badge>
                    </TableCell>
                    <TableCell>{location.address}</TableCell>
                    <TableCell>
                      {location.city}, {location.state} {location.zip}
                    </TableCell>
                    <TableCell>
                      {location.contactName ? (
                        <div>
                          <div className="font-medium">{location.contactName}</div>
                          {location.contactPhone && (
                            <div className="text-sm text-muted-foreground">
                              {location.contactPhone}
                            </div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Pickups: {location.pickupCount}</div>
                        <div>Deliveries: {location.deliveryCount}</div>
                      </div>
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
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total} locations
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
              entityType="location"
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

