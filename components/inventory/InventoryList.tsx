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
import { Warehouse, Plus, Search, Download, Upload, AlertTriangle } from 'lucide-react';
import { formatCurrency, apiUrl } from '@/lib/utils';
import ImportDialog from '@/components/import-export/ImportDialog';
import ExportDialog from '@/components/import-export/ExportDialog';
import BulkActionBar from '@/components/import-export/BulkActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

interface InventoryItem {
  id: string;
  itemNumber: string;
  name: string;
  category?: string | null;
  partNumber?: string | null;
  manufacturer?: string | null;
  unit: string;
  quantityOnHand: number;
  reorderPoint: number;
  unitCost: number;
  warehouseLocation?: string | null;
  preferredVendor?: {
    id: string;
    name: string;
    vendorNumber: string;
  } | null;
}

async function fetchInventory(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.category) queryParams.set('category', params.category);

  const response = await fetch(apiUrl(`/api/inventory?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch inventory');
  return response.json();
}

export default function InventoryList() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory', page, searchQuery],
    queryFn: () =>
      fetchInventory({
        page,
        limit: 20,
        search: searchQuery || undefined,
      }),
  });

  const items: InventoryItem[] = data?.data?.items || [];
  const pagination = data?.data?.pagination;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const isLowStock = (item: InventoryItem) => {
    return item.quantityOnHand <= item.reorderPoint;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading inventory</p>
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
        </div>
        <div className="flex items-center gap-2">
          <ImportDialog entityType="inventory" onImportComplete={() => refetch()} />
          <ExportDialog entityType="inventory" />
          <Link href="/dashboard/inventory/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by item number, name, part number..."
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
          <div className="text-muted-foreground">Loading inventory...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center justify-center h-96 border rounded-lg">
          <div className="text-center">
            <Warehouse className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No inventory items found</p>
            <Link href="/dashboard/inventory/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Inventory Item
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
                      checked={selectedIds.length === items.length && items.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Item #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Part #</TableHead>
                  <TableHead>Qty On Hand</TableHead>
                  <TableHead>Reorder Point</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.itemNumber}</TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/inventory/${item.id}`}
                        className="hover:underline"
                      >
                        {item.name}
                      </Link>
                    </TableCell>
                    <TableCell>{item.category || '-'}</TableCell>
                    <TableCell>{item.partNumber || '-'}</TableCell>
                    <TableCell>{item.quantityOnHand.toFixed(2)} {item.unit}</TableCell>
                    <TableCell>{item.reorderPoint.toFixed(2)}</TableCell>
                    <TableCell>{formatCurrency(item.unitCost)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.quantityOnHand * item.unitCost)}
                    </TableCell>
                    <TableCell>
                      {isLowStock(item) ? (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <AlertTriangle className="h-3 w-3" />
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          In Stock
                        </Badge>
                      )}
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
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total} items
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
              entityType="inventory"
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

