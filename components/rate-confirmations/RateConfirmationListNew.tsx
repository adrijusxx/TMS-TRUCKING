'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import { rateConfirmationsTableConfig, type RateConfirmationData } from '@/lib/config/entities/rate-confirmations';
import { createEntityFetcher } from '@/lib/utils/entity-fetcher';
import { useEntityList } from '@/hooks/useEntityList';

const fetchRateConfirmations = createEntityFetcher<RateConfirmationData>({
  endpoint: '/api/rate-confirmations',
  defaultSortBy: 'createdAt',
  defaultSortOrder: 'desc',
});

export default function RateConfirmationListNew() {
  const {
    handleUpdate,
    rowSelection,
    setRowSelection,
    selectedRowIds,
    can,
  } = useEntityList({
    entityType: 'rate-confirmations',
    editPermission: 'rate_confirmations.edit',
    idParam: 'rateConfirmationId',
    queryKey: 'rate-confirmations',
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          {can('data.import') && (
            <ImportSheet entityType="rate-confirmations" onImportComplete={handleUpdate}>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportSheet>
          )}
          {can('data.export') && (
            <ExportDialog entityType="rate-confirmations">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          )}
          {can('rate_confirmations.create') && (
            <Link href="/dashboard/accounting/rate-confirmations/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Rate Confirmation
              </Button>
            </Link>
          )}
        </div>
      </div>

      <DataTableWrapper
        config={rateConfirmationsTableConfig as any}
        fetchData={fetchRateConfirmations}
        emptyMessage="No rate confirmations found. Get started by creating your first rate confirmation."
        enableColumnVisibility={can('data.column_visibility')}
        enableRowSelection={true}
        onRowSelectionChange={React.useCallback((selection: Record<string, boolean>) => {
          setRowSelection(selection);
        }, [setRowSelection])}
      />

      {selectedRowIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedRowIds}
          onClearSelection={() => setRowSelection({})}
          entityType="rate-confirmations"
          bulkEditFields={rateConfirmationsTableConfig.bulkEditFields}
          customBulkActions={rateConfirmationsTableConfig.customBulkActions}
          enableBulkEdit={can('rate_confirmations.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('rate_confirmations.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={handleUpdate}
        />
      )}
    </div>
  );
}
