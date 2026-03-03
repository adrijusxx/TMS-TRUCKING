'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { trucksTableConfig, type TruckData } from '@/lib/config/entities/trucks';
import { createEntityFetcher } from '@/lib/utils/entity-fetcher';
import TruckInlineEdit from './TruckInlineEdit';
import TruckSheet from './TruckSheet';
import { useEntityList } from '@/hooks/useEntityList';

const fetchTrucks = createEntityFetcher<TruckData>({
  endpoint: '/api/trucks',
  defaultSortBy: 'truckNumber',
  defaultSortOrder: 'asc',
});

export default function TruckList() {
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          {can('data.import') && (
            <ImportSheet entityType="trucks" onImportComplete={handleUpdate}>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportSheet>
          )}
          {can('data.export') && (
            <ExportDialog entityType="trucks">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          )}
          {can('trucks.create') && (
            <Button size="sm" onClick={() => openSheet('create')}>
              <Plus className="h-4 w-4 mr-2" />
              New Truck
            </Button>
          )}
        </div>
      </div>

      <DataTableWrapper
        config={trucksTableConfig as any}
        fetchData={fetchTrucks}
        onRowClick={(row) => openSheet(getViewMode(), row.id)}
        inlineEditComponent={can('trucks.edit') ? TruckInlineEdit : undefined}
        emptyMessage="No trucks found. Get started by adding your first truck."
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
          entityType="trucks"
          bulkEditFields={trucksTableConfig.bulkEditFields}
          customBulkActions={trucksTableConfig.customBulkActions}
          enableBulkEdit={can('trucks.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('trucks.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
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
    </div>
  );
}
