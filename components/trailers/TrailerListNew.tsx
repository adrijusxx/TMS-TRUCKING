'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { trailersTableConfig, type TrailerData } from '@/lib/config/entities/trailers';
import { createEntityFetcher } from '@/lib/utils/entity-fetcher';
import TrailerInlineEdit from './TrailerInlineEdit';
import TrailerSheet from './TrailerSheet';
import { useEntityList } from '@/hooks/useEntityList';

const fetchTrailers = createEntityFetcher<TrailerData>({
  endpoint: '/api/trailers',
  defaultSortBy: 'trailerNumber',
  defaultSortOrder: 'asc',
});

export default function TrailerListNew() {
  const {
    sheetOpen,
    setSheetOpen,
    sheetMode,
    selectedId,
    openSheet,
    handleUpdate,
    rowSelection,
    setRowSelection,
    selectedRowIds,
    can,
    getViewMode,
  } = useEntityList({
    entityType: 'trailers',
    editPermission: 'trailers.edit',
    idParam: 'trailerId',
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          {can('data.import') && (
            <ImportSheet entityType="trailers" onImportComplete={handleUpdate}>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportSheet>
          )}
          {can('data.export') && (
            <ExportDialog entityType="trailers">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          )}
          {can('trailers.create') && (
            <Link href="/dashboard/trailers/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Trailer
              </Button>
            </Link>
          )}
        </div>
      </div>

      <DataTableWrapper
        config={trailersTableConfig as any}
        fetchData={fetchTrailers}
        onRowClick={(row) => openSheet(getViewMode(), row.id)}
        inlineEditComponent={can('trailers.edit') ? TrailerInlineEdit : undefined}
        emptyMessage="No trailers found. Get started by adding your first trailer."
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
          entityType="trailers"
          bulkEditFields={trailersTableConfig.bulkEditFields}
          customBulkActions={trailersTableConfig.customBulkActions}
          enableBulkEdit={can('trailers.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('trailers.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={handleUpdate}
        />
      )}

      <TrailerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        trailerId={selectedId}
      />
    </div>
  );
}
