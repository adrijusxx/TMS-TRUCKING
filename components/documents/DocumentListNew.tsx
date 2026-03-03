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
import { documentsTableConfig, type DocumentData } from '@/lib/config/entities/documents';
import { createEntityFetcher } from '@/lib/utils/entity-fetcher';
import DocumentInlineEdit from './DocumentInlineEdit';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface DocumentListNewProps {
  loadId?: string;
  driverId?: string;
  truckId?: string;
}

const fetchDocuments = createEntityFetcher<DocumentData>({
  endpoint: '/api/documents',
  defaultSortBy: 'createdAt',
  defaultSortOrder: 'desc',
});

export default function DocumentListNew({ loadId, driverId, truckId }: DocumentListNewProps) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { can } = usePermissions();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Wrap to inject context filters
  const fetchWithContext = React.useCallback(async (params: any) => {
    return fetchDocuments({
      ...params,
      ...(loadId && { loadId }),
      ...(driverId && { driverId }),
      ...(truckId && { truckId }),
    });
  }, [loadId, driverId, truckId]);

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
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (loadId) queryClient.invalidateQueries({ queryKey: ['loads', loadId] });
      if (driverId) queryClient.invalidateQueries({ queryKey: ['drivers', driverId] });
      if (truckId) queryClient.invalidateQueries({ queryKey: ['trucks', truckId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete document');
    }
  };

  const rowActions = (row: DocumentData) => {
    const isDispatcher = session?.user?.role === 'DISPATCHER';
    const isCriticalDoc = ['BOL', 'POD', 'RATE_CONFIRMATION'].includes(row.type);
    const canDelete = isDispatcher ? isCriticalDoc : can('documents.delete');

    return (
      <div className="flex items-center gap-2">
        <a href={row.fileUrl} target="_blank" rel="noopener noreferrer" download>
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

      <DataTableWrapper
        config={documentsTableConfig as any}
        fetchData={fetchWithContext}
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
