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
import { Store, Plus, Search, Download, Upload } from 'lucide-react';
import ImportDialog from '@/components/import-export/ImportDialog';
import ExportDialog from '@/components/import-export/ExportDialog';
import BulkActionBar from '@/components/import-export/BulkActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { apiUrl } from '@/lib/utils';

interface Vendor {
  id: string;
  vendorNumber: string;
  name: string;
  type: string;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
  totalOrders: number;
  totalSpent: number;
  contacts: Array<{
    name: string;
    email: string;
    phone: string;
    isPrimary: boolean;
  }>;
}

async function fetchVendors(params: {
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

  const response = await fetch(apiUrl(`/api/vendors?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch vendors');
  return response.json();
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function VendorList() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vendors', page, searchQuery],
    queryFn: () =>
      fetchVendors({
        page,
        limit: 20,
        search: searchQuery || undefined,
      }),
  });

  const vendors: Vendor[] = data?.data?.vendors || [];
  const pagination = data?.data?.pagination;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === vendors.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(vendors.map((v) => v.id));
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading vendors</p>
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
          <h1 className="text-3xl font-bold">Vendors</h1>
          <p className="text-muted-foreground">Manage vendor relationships and contacts</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportDialog entityType="vendors" onImportComplete={() => refetch()} />
          <ExportDialog entityType="vendors" />
          <Link href="/dashboard/vendors/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Vendor
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by vendor number, name, email..."
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
          <div className="text-muted-foreground">Loading vendors...</div>
        </div>
      ) : vendors.length === 0 ? (
        <div className="flex items-center justify-center h-96 border rounded-lg">
          <div className="text-center">
            <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No vendors found</p>
            <Link href="/dashboard/vendors/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
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
                      checked={selectedIds.length === vendors.length && vendors.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Vendor #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(vendor.id)}
                        onCheckedChange={() => toggleSelect(vendor.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{vendor.vendorNumber}</TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/vendors/${vendor.id}`}
                        className="font-medium hover:underline"
                      >
                        {vendor.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatType(vendor.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      {vendor.city && vendor.state ? `${vendor.city}, ${vendor.state}` : '-'}
                    </TableCell>
                    <TableCell>
                      {vendor.contacts.length > 0 ? (
                        <div>
                          <div className="font-medium">{vendor.contacts[0].name}</div>
                          <div className="text-sm text-muted-foreground">
                            {vendor.contacts[0].email}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {vendor.contacts[0].phone}
                          </div>
                        </div>
                      ) : (
                        vendor.email || vendor.phone || '-'
                      )}
                    </TableCell>
                    <TableCell>{vendor.totalOrders}</TableCell>
                    <TableCell className="font-medium">
                      ${vendor.totalSpent.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
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
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total} vendors
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
              entityType="vendor"
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

