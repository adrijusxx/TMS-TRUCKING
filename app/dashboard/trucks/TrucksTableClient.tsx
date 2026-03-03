'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import TruckSheet from '@/components/trucks/TruckSheet';
import { useEntityList } from '@/hooks/useEntityList';
import { trucksTableConfig, type TruckData } from '@/lib/config/entities/trucks';
import { createEntityFetcher } from '@/lib/utils/entity-fetcher';

const fetchTrucks = createEntityFetcher<TruckData>({
  endpoint: '/api/trucks',
  defaultSortBy: 'truckNumber',
  defaultSortOrder: 'asc',
});

export function TrucksTableClient() {
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
    entityType: 'trucks',
    editPermission: 'trucks.edit',
    idParam: 'truckId',
  });

  return (
    <div className="space-y-2">
      <DataTableWrapper
        config={trucksTableConfig as any}
        fetchData={fetchTrucks}
        onRowClick={(row) => openSheet(getViewMode(), row.id)}
        emptyMessage="No trucks found"
        enableColumnVisibility={true}
        enableRowSelection={true}
        enableColumnReorder={true}
        onRowSelectionChange={React.useCallback((selection: Record<string, boolean>) => {
          setRowSelection(selection);
        }, [setRowSelection])}
        toolbarActions={
          <>
            {can('data.import') && (
              <ImportSheet entityType="trucks" onImportComplete={handleUpdate}>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </ImportSheet>
            )}
            {can('data.export') && (
              <ExportDialog entityType="trucks">
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </ExportDialog>
            )}
            {can('trucks.create') && (
              <Button size="sm" className="h-8 text-xs" onClick={() => openSheet('create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Truck
              </Button>
            )}
          </>
        }
      />

      {selectedRowIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedRowIds}
          onClearSelection={() => setRowSelection({})}
          entityType="trucks"
          bulkEditFields={trucksTableConfig.bulkEditFields}
          enableBulkEdit={true}
          enableBulkDelete={true}
          enableBulkExport={true}
          onActionComplete={handleUpdate}
        />
      )}

      <TruckSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        truckId={selectedId}
        onSuccess={handleUpdate}
      />

      <div className="hidden">
        <ImportSheet entityType="trucks" onImportComplete={handleUpdate}>
          <button data-import-trigger="trucks" type="button" />
        </ImportSheet>
      </div>
    </div>
  );
}
