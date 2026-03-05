'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Send, Trash2 } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import { PageShell } from '@/components/layout/PageShell';
import { usePermissions } from '@/hooks/usePermissions';
import { batchesTableConfig } from '@/lib/config/entities/batches';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';

interface BatchData {
  id: string;
  batchNumber: string;
  postStatus: string;
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

interface BatchListNewProps {
  /** When true, skips PageShell wrapper (for use as embedded tab) */
  embedded?: boolean;
}

export default function BatchListNew({ embedded }: BatchListNewProps = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [deleteBatchId, setDeleteBatchId] = React.useState<string | null>(null);

  const fetchBatches = async (params: {
    page?: number;
    pageSize?: number;
    sorting?: SortingState;
    filters?: ColumnFiltersState;
    [key: string]: any;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.pageSize) queryParams.set('limit', params.pageSize.toString());

    if (params.filters) {
      params.filters.forEach((filter) => {
        if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
          queryParams.set(filter.id, String(filter.value));
        }
      });
    }

    if (params.search) {
      queryParams.set('search', params.search);
    }

    const response = await fetch(apiUrl(`/api/batches?${queryParams}`));
    if (!response.ok) throw new Error('Failed to fetch batches');
    const result = await response.json();

    return {
      data: result.data || [],
      meta: result.meta
        ? {
          totalCount: result.meta.total,
          totalPages: result.meta.totalPages,
          page: result.meta.page,
          pageSize: result.meta.limit,
        }
        : {
          totalCount: result.data?.length || 0,
          totalPages: 1,
          page: params.page || 1,
          pageSize: params.pageSize || 20,
        },
    };
  };

  const handleDelete = async (batchId: string) => {
    try {
      const response = await fetch(apiUrl(`/api/batches/${batchId}`), {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete batch');
      }
      toast.success('Batch deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setDeleteBatchId(null);
      setSelectedIds([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete batch');
    }
  };

  const handleSendSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(
        selectedIds.map((batchId) =>
          fetch(apiUrl(`/api/batches/${batchId}/send`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          })
        )
      );
      toast.success(`Sent ${selectedIds.length} batch(es)`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    } catch {
      toast.error('Failed to send batches');
    }
  };

  const handleChangeStatus = async (status: string) => {
    if (selectedIds.length === 0 || !status) return;
    try {
      await Promise.all(
        selectedIds.map((batchId) =>
          fetch(apiUrl(`/api/batches/${batchId}/status`), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postStatus: status }),
          })
        )
      );
      toast.success(`Updated ${selectedIds.length} batch(es) to ${status}`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    } catch {
      toast.error('Failed to update batches');
    }
  };

  const rowActions = (row: BatchData) => (
    <div className="flex items-center gap-2">
      {(row.postStatus === 'UNPOSTED' || can('batches.delete_posted')) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteBatchId(row.id)}
          className="text-destructive hover:text-destructive"
          title={row.postStatus !== 'UNPOSTED' ? 'Delete posted batch' : 'Delete batch'}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      <Link href={`/dashboard/invoices/batches/${row.batchNumber || row.id}`}>
        <Button variant="ghost" size="sm">View</Button>
      </Link>
    </div>
  );

  const actions = (
    <div className="flex items-center gap-2">
      {selectedIds.length > 0 && (
        <>
          <Button variant="outline" size="sm" onClick={handleSendSelected}>
            <Send className="h-4 w-4 mr-1" />
            Send ({selectedIds.length})
          </Button>
          <Select value="" onValueChange={(v) => handleChangeStatus(v)}>
            <SelectTrigger className="w-[150px] h-8">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UNPOSTED">Unposted</SelectItem>
              <SelectItem value="POSTED">Posted</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
            </SelectContent>
          </Select>
        </>
      )}
      {can('batches.create') && (
        <Button size="sm" onClick={() => router.push('/dashboard/invoices/batches/new')}>
          <Plus className="h-4 w-4 mr-1" />
          Create Batch
        </Button>
      )}
    </div>
  );

  const content = (
    <>
      {embedded && <div className="flex justify-end mb-3">{actions}</div>}
      <DataTableWrapper
        config={batchesTableConfig}
        fetchData={fetchBatches}
        rowActions={rowActions}
        onRowClick={(row) => router.push(`/dashboard/invoices/batches/${row.batchNumber || row.id}`)}
        emptyMessage="No batches found. Get started by creating your first batch."
        enableColumnVisibility={can('data.column_visibility')}
        enableRowSelection={true}
        onRowSelectionChange={(selection) => {
          const ids = Object.keys(selection).filter((key) => selection[key]);
          setSelectedIds(ids);
        }}
      />

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedIds}
          onClearSelection={() => setSelectedIds([])}
          entityType="batches"
          bulkEditFields={batchesTableConfig.bulkEditFields}
          customBulkActions={batchesTableConfig.customBulkActions}
          enableBulkEdit={can('batches.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('batches.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={() => { }}
        />
      )}

      <AlertDialog open={!!deleteBatchId} onOpenChange={(open) => !open && setDeleteBatchId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Batch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this batch? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteBatchId) {
                  handleDelete(deleteBatchId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  if (embedded) return content;

  return (
    <PageShell title="Batches" description="Manage invoice batches for billing" actions={actions}>
      {content}
    </PageShell>
  );
}
