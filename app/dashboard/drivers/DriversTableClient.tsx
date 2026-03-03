'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import DriverSheet from '@/components/drivers/DriverSheet';
import { useEntityList } from '@/hooks/useEntityList';
import { driversTableConfig, type DriverData } from '@/lib/config/entities/drivers';
import { createEntityFetcher } from '@/lib/utils/entity-fetcher';

const fetchDrivers = createEntityFetcher<DriverData>({
  endpoint: '/api/drivers',
  defaultSortBy: 'createdAt',
  defaultSortOrder: 'desc',
});

export function DriversTableClient() {
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
    entityType: 'drivers',
    editPermission: 'drivers.edit',
    idParam: 'driverId',
  });

  return (
    <div className="space-y-2">
      <DataTableWrapper
        config={driversTableConfig as any}
        fetchData={fetchDrivers}
        onRowClick={(row) => openSheet(getViewMode(), row.id)}
        emptyMessage="No drivers found"
        enableColumnVisibility={true}
        enableRowSelection={true}
        enableColumnReorder={true}
        onRowSelectionChange={React.useCallback((selection: Record<string, boolean>) => {
          setRowSelection(selection);
        }, [setRowSelection])}
        toolbarActions={
          <>
            {can('data.import') && (
              <ImportSheet
                entityType="drivers"
                onImportComplete={handleUpdate}
              >
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </ImportSheet>
            )}
            {can('data.export') && (
              <ExportDialog entityType="drivers">
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </ExportDialog>
            )}
            {can('drivers.create') && (
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => openSheet('create')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Driver
              </Button>
            )}
          </>
        }
      />

      {selectedRowIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedRowIds}
          onClearSelection={() => setRowSelection({})}
          entityType="drivers"
          bulkEditFields={driversTableConfig.bulkEditFields}
          customBulkActions={driversTableConfig.customBulkActions}
          enableBulkEdit={true}
          enableBulkDelete={true}
          enableBulkExport={true}
          onActionComplete={handleUpdate}
        />
      )}

      <DriverSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        driverId={selectedId}
        onSuccess={handleUpdate}
      />

      <div className="hidden">
        <ImportSheet entityType="drivers" onImportComplete={handleUpdate}>
          <button data-import-trigger="drivers" type="button" />
        </ImportSheet>
      </div>
    </div>
  );
}
