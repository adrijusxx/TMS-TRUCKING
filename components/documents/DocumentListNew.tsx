'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Download, Trash2 } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ExportDialog from '@/components/import-export/ExportDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { documentsTableConfig } from '@/lib/config/entities/documents';
import DocumentInlineEdit from './DocumentInlineEdit';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

interface DocumentData {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  description?: string;
  createdAt: string;
  uploadedBy: {
    firstName: string;
    lastName: string;
  };
  load?: {
    loadNumber: string;
  };
  driver?: {
    driverNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  truck?: {
    truckNumber: string;
  };
}

interface DocumentListNewProps {
  loadId?: string;
  driverId?: string;
  truckId?: string;
}

export default function DocumentListNew({ loadId, driverId, truckId }: DocumentListNewProps) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { can } = usePermissions();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const fetchDocuments = async (params: {
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

    // Add context filters
    if (loadId) queryParams.set('loadId', loadId);
    if (driverId) queryParams.set('driverId', driverId);
    if (truckId) queryParams.set('truckId', truckId);

    const response = await fetch(apiUrl(`/api/documents?${queryParams}`));
    if (!response.ok) throw new Error('Failed to fetch documents');
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

  const handleDelete = async (documentId: string, documentType: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(apiUrl(`/api/documents/${documentId}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete document');
      }

      toast.success('Document deleted successfully');
      
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (loadId) {
        queryClient.invalidateQueries({ queryKey: ['loads', loadId] });
      }
      if (driverId) {
        queryClient.invalidateQueries({ queryKey: ['drivers', driverId] });
      }
      if (truckId) {
        queryClient.invalidateQueries({ queryKey: ['trucks', truckId] });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete document');
    }
  };

  const rowActions = (row: DocumentData) => {
    // Permission logic: Dispatchers can only delete BOL, POD, and RATE_CONFIRMATION
    // Other roles need full documents.delete permission
    const isDispatcher = session?.user?.role === 'DISPATCHER';
    const isCriticalDoc = ['BOL', 'POD', 'RATE_CONFIRMATION'].includes(row.type);
    const canDelete = isDispatcher 
      ? isCriticalDoc 
      : can('documents.delete');

    return (
      <div className="flex items-center gap-2">
        <a
          href={row.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
        >
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </a>
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.id, row.type)}
            title={isDispatcher && !isCriticalDoc ? 'Dispatchers can only delete BOL, POD, and Rate Confirmation documents' : 'Delete document'}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          {can('data.export') && (
            <ExportDialog entityType="documents">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTableWrapper
        config={documentsTableConfig}
        fetchData={fetchDocuments}
        rowActions={rowActions}
        inlineEditComponent={can('documents.upload') ? DocumentInlineEdit : undefined}
        emptyMessage="No documents found. Upload your first document to get started."
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
          entityType="documents"
          bulkEditFields={documentsTableConfig.bulkEditFields}
          customBulkActions={documentsTableConfig.customBulkActions}
          enableBulkEdit={can('documents.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('documents.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={() => {}}
        />
      )}
    </div>
  );
}

