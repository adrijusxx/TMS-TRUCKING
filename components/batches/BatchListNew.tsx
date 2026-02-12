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
import { Plus, Upload, Download, Send, Trash2 } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
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

export default function BatchListNew() {
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

    // Handle filters
    if (params.filters) {
      params.filters.forEach((filter) => {
        if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
          queryParams.set(filter.id, String(filter.value));
        }
      });
    }

    // Add search if provided
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

  const handleSendToFactoring = async (batchId: string) => {
    try {
      const response = await fetch(apiUrl(`/api/batches/${batchId}/send`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to send batch');
      }
      toast.success('Batch sent to factoring');
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send batch');
    }
  };

  const rowActions = (row: BatchData) => (
    <div className="flex items-center gap-2">
      {row.postStatus === 'UNPOSTED' && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSendToFactoring(row.id)}
            title="Send to factoring"
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteBatchId(row.id)}
            className="text-destructive hover:text-destructive"
            title="Delete batch"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
      <Link href={`/dashboard/batches/${row.id}`}>
        <Button variant="ghost" size="sm">
          View
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          {can('data.import') && (
            <ImportSheet
              entityType="batches"
              onImportComplete={() => queryClient.invalidateQueries({ queryKey: ['batches'] })}
            >
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportSheet>
          )}
          {can('data.export') && (
            <ExportDialog entityType="batches">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          )}
          {can('batches.create') && (
            <Button size="sm" onClick={() => router.push('/dashboard/batches/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Batch
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTableWrapper
        config={batchesTableConfig}
        fetchData={fetchBatches}
        rowActions={rowActions}
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
              Only UNPOSTED batches can be deleted.
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
    </div>
  );
}

