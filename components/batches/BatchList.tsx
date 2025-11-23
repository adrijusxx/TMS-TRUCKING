'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Plus, Search, Filter, Download, Send, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { BatchPostStatus } from '@prisma/client';
import CreateBatchForm from './CreateBatchForm';

interface Batch {
  id: string;
  batchNumber: string;
  postStatus: BatchPostStatus;
  mcNumber: string | null;
  totalAmount: number;
  invoiceCount: number;
  notes: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const statusColors: Record<BatchPostStatus, string> = {
  UNPOSTED: 'bg-orange-100 text-orange-800 border-orange-200',
  POSTED: 'bg-blue-100 text-blue-800 border-blue-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
};

function formatStatus(status: BatchPostStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function fetchBatches(params: {
  page?: number;
  limit?: number;
  postStatus?: string;
  search?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.postStatus) queryParams.set('postStatus', params.postStatus);
  if (params.search) queryParams.set('search', params.search);

  const response = await fetch(apiUrl(`/api/batches?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch batches');
  return response.json();
}

export default function BatchList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [createBatchDialogOpen, setCreateBatchDialogOpen] = useState(false);
  const [deleteBatchId, setDeleteBatchId] = useState<string | null>(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['batches', page, statusFilter, searchQuery],
    queryFn: () =>
      fetchBatches({
        page,
        limit: 100,
        postStatus: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
      }),
  });

  const deleteBatchMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const response = await fetch(apiUrl(`/api/batches/${batchId}`), {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete batch');
      }
      return response.json();
    },
                onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setDeleteBatchId(null);
      setSelectedBatchIds([]); // Clear selection after delete
      toast.success('Batch deleted successfully');
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete batch');
    },
  });

  const batches: Batch[] = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-muted-foreground">
            Manage invoice batches
          </p>
        </div>
        <div className="flex gap-2">
          {selectedBatchIds.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => {
                // For now, delete first selected batch (can enhance to bulk delete later)
                if (selectedBatchIds.length === 1) {
                  setDeleteBatchId(selectedBatchIds[0]);
                } else {
                  toast.error('Please delete batches one at a time');
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedBatchIds.length})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              const exportData = batches.map((batch) => ({
                'Batch ID': batch.batchNumber,
                'Post Status': batch.postStatus,
                'Created By': `${batch.createdBy.firstName} ${batch.createdBy.lastName}`,
                'Created Date': formatDate(batch.createdAt),
                'Invoices': batch.invoiceCount,
                'MC Number': batch.mcNumber || '',
                'Total Amount': formatCurrency(batch.totalAmount),
                'Notes': batch.notes || '',
              }));
              // Export logic would go here
            }}
            disabled={batches.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setCreateBatchDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create new batch
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by batch number, MC number, or notes..."
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
                {formatStatus(status as BatchPostStatus)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading batches...</div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          Error loading batches. Please try again.
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No batches found</p>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first batch to group invoices together'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link href="/dashboard/accounting/batches/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create new batch
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
                  <TableHead>
                    <Checkbox
                      checked={batches.length > 0 && batches.every((b) => selectedBatchIds.includes(b.id))}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedBatchIds(batches.map((b) => b.id));
                        } else {
                          setSelectedBatchIds([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Post status</TableHead>
                  <TableHead>Created by</TableHead>
                  <TableHead>Created date</TableHead>
                  <TableHead>Invoices</TableHead>
                  <TableHead>MC number</TableHead>
                  <TableHead className="text-right">Total amount</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedBatchIds.includes(batch.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedBatchIds([...selectedBatchIds, batch.id]);
                          } else {
                            setSelectedBatchIds(selectedBatchIds.filter((id) => id !== batch.id));
                          }
                        }}
                        disabled={batch.postStatus !== 'UNPOSTED'} // Only allow selecting UNPOSTED batches for deletion
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/accounting/batches/${batch.id}`}
                        className="text-primary hover:underline"
                      >
                        {batch.batchNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[batch.postStatus]}
                      >
                        {formatStatus(batch.postStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {batch.createdBy.firstName} {batch.createdBy.lastName}
                    </TableCell>
                    <TableCell>{formatDate(batch.createdAt)}</TableCell>
                    <TableCell>{batch.invoiceCount}</TableCell>
                    <TableCell>{batch.mcNumber || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(batch.totalAmount)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {batch.notes || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {batch.postStatus === 'UNPOSTED' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                const response = await fetch(
                                  apiUrl(`/api/batches/${batch.id}/send`),
                                  {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({}),
                                  }
                                );
                                if (response.ok) {
                                  refetch();
                                  toast.success('Batch sent to factoring');
                                }
                              }}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteBatchId(batch.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Link href={`/dashboard/accounting/batches/${batch.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
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
                Showing {((page - 1) * 100) + 1} to{' '}
                {Math.min(page * 100, meta.total)} of {meta.total} batches
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

      <CreateBatchForm
        open={createBatchDialogOpen}
        onOpenChange={setCreateBatchDialogOpen}
      />

      <AlertDialog open={!!deleteBatchId} onOpenChange={(open) => !open && setDeleteBatchId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Batch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this batch? This action cannot be undone.
              Only UNPOSTED batches can be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteBatchId) {
                  deleteBatchMutation.mutate(deleteBatchId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteBatchMutation.isPending}
            >
              {deleteBatchMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

