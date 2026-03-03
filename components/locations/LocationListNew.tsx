'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import { locationsTableConfig, type LocationData } from '@/lib/config/entities/locations';
import { createEntityFetcher } from '@/lib/utils/entity-fetcher';
import LocationInlineEdit from '@/components/locations/LocationInlineEdit';
import { useEntityList } from '@/hooks/useEntityList';

const fetchLocations = createEntityFetcher<LocationData>({
  endpoint: '/api/locations',
  dataKey: 'locations',
  defaultSortBy: 'name',
  defaultSortOrder: 'asc',
});

export default function LocationListNew() {
  const {
    handleUpdate,
    handleDelete,
    rowSelection,
    setRowSelection,
    selectedRowIds,
    can,
  } = useEntityList({
    entityType: 'locations',
    editPermission: 'locations.edit',
    idParam: 'locationId',
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          {can('data.import') && (
            <ImportSheet entityType="locations" onImportComplete={handleUpdate}>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportSheet>
          )}
          {can('data.export') && (
            <ExportDialog entityType="locations">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          )}
          {can('locations.create') && (
            <Link href="/dashboard/locations/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Location
              </Button>
            </Link>
          )}
        </div>
      </div>

      <DataTableWrapper
        config={locationsTableConfig as any}
        fetchData={fetchLocations}
        inlineEditComponent={can('locations.edit') ? LocationInlineEdit : undefined}
        emptyMessage="No locations found. Get started by adding your first location."
        enableColumnVisibility={can('data.column_visibility')}
        enableRowSelection={true}
        onRowSelectionChange={React.useCallback((selection: Record<string, boolean>) => {
          setRowSelection(selection);
        }, [setRowSelection])}
        onDeleteSelected={handleDelete}
      />

      {selectedRowIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedRowIds}
          onClearSelection={() => setRowSelection({})}
          entityType="locations"
          bulkEditFields={locationsTableConfig.bulkEditFields}
          customBulkActions={locationsTableConfig.customBulkActions}
          enableBulkEdit={can('locations.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('locations.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={handleUpdate}
        />
      )}
    </div>
  );
}
