'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import TrailerSheet from '@/components/trailers/TrailerSheet';
import { useEntityList } from '@/hooks/useEntityList';
import { trailersTableConfig, type TrailerData } from '@/lib/config/entities/trailers';
import { createEntityFetcher } from '@/lib/utils/entity-fetcher';

const fetchTrailers = createEntityFetcher<TrailerData>({
  endpoint: '/api/trailers',
  defaultSortBy: 'trailerNumber',
  defaultSortOrder: 'asc',
});

export function TrailersTableClient() {
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
    <div className="space-y-2">
      <DataTableWrapper
        config={trailersTableConfig as any}
        fetchData={fetchTrailers}
        onRowClick={(row) => openSheet(getViewMode(), row.id)}
        emptyMessage="No trailers found"
        enableColumnVisibility={true}
        enableRowSelection={true}
        enableColumnReorder={true}
        onRowSelectionChange={React.useCallback((selection: Record<string, boolean>) => {
          setRowSelection(selection);
        }, [setRowSelection])}
        toolbarActions={
          <>
            {can('data.import') && (
              <ImportSheet entityType="trailers" onImportComplete={handleUpdate}>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </ImportSheet>
            )}
            {can('data.export') && (
              <ExportDialog entityType="trailers">
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </ExportDialog>
            )}
            {can('trailers.create') && (
              <Button size="sm" className="h-8 text-xs" onClick={() => openSheet('create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Trailer
              </Button>
            )}
          </>
        }
      />

      {selectedRowIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedRowIds}
          onClearSelection={() => setRowSelection({})}
          entityType="trailers"
          bulkEditFields={trailersTableConfig.bulkEditFields}
          enableBulkEdit={true}
          enableBulkDelete={true}
          enableBulkExport={true}
          onActionComplete={handleUpdate}
        />
      )}

      <TrailerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        trailerId={selectedId}
        onSuccess={handleUpdate}
      />

      <div className="hidden">
        <ImportSheet entityType="trailers" onImportComplete={handleUpdate}>
          <button data-import-trigger="trailers" type="button" />
        </ImportSheet>
      </div>
    </div>
  );
}
