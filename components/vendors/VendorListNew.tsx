'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import { vendorsTableConfig, type VendorData } from '@/lib/config/entities/vendors';
import { createEntityFetcher } from '@/lib/utils/entity-fetcher';
import { useEntityList } from '@/hooks/useEntityList';

const fetchVendors = createEntityFetcher<VendorData>({
  endpoint: '/api/vendors',
  dataKey: 'vendors',
  defaultSortBy: 'name',
  defaultSortOrder: 'asc',
});

export default function VendorListNew() {
  const {
    handleUpdate,
    rowSelection,
    setRowSelection,
    selectedRowIds,
    can,
  } = useEntityList({
    entityType: 'vendors',
    editPermission: 'vendors.edit',
    idParam: 'vendorId',
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          {can('data.import') && (
            <ImportSheet entityType="vendors" onImportComplete={handleUpdate}>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportSheet>
          )}
          {can('data.export') && (
            <ExportDialog entityType="vendors">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          )}
          {can('vendors.create') && (
            <Link href="/dashboard/vendors/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Vendor
              </Button>
            </Link>
          )}
        </div>
      </div>

      <DataTableWrapper
        config={vendorsTableConfig as any}
        fetchData={fetchVendors}
        emptyMessage="No vendors found. Get started by adding your first vendor."
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
          entityType="vendors"
          bulkEditFields={vendorsTableConfig.bulkEditFields}
          customBulkActions={vendorsTableConfig.customBulkActions}
          enableBulkEdit={can('vendors.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('vendors.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={handleUpdate}
        />
      )}
    </div>
  );
}
