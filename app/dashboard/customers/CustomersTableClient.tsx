'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import CustomerSheet from '@/components/customers/CustomerSheet';
import { useEntityList } from '@/hooks/useEntityList';
import { customersTableConfig, type CustomerData } from '@/lib/config/entities/customers';
import { createEntityFetcher } from '@/lib/utils/entity-fetcher';

const fetchCustomers = createEntityFetcher<CustomerData>({
  endpoint: '/api/customers',
  defaultSortBy: 'name',
  defaultSortOrder: 'asc',
});

export function CustomersTableClient() {
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
    entityType: 'customers',
    editPermission: 'customers.edit',
    idParam: 'customerId',
  });

  return (
    <div className="space-y-2">
      <DataTableWrapper
        config={customersTableConfig as any}
        fetchData={fetchCustomers}
        onRowClick={(row) => openSheet(getViewMode(), row.id)}
        emptyMessage="No customers found"
        enableColumnVisibility={true}
        enableRowSelection={true}
        enableColumnReorder={true}
        onRowSelectionChange={React.useCallback((selection: Record<string, boolean>) => {
          setRowSelection(selection);
        }, [setRowSelection])}
        toolbarActions={
          <>
            {can('data.import') && (
              <ImportSheet entityType="customers" onImportComplete={handleUpdate}>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </ImportSheet>
            )}
            {can('data.export') && (
              <ExportDialog entityType="customers">
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </ExportDialog>
            )}
            {can('customers.create') && (
              <Button size="sm" className="h-8 text-xs" onClick={() => openSheet('create')}>
                <Plus className="h-4 w-4 mr-2" />
                New Customer
              </Button>
            )}
          </>
        }
      />

      {selectedRowIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedRowIds}
          onClearSelection={() => setRowSelection({})}
          entityType="customers"
          bulkEditFields={customersTableConfig.bulkEditFields}
          enableBulkEdit={true}
          enableBulkDelete={true}
          enableBulkExport={true}
          onActionComplete={handleUpdate}
        />
      )}

      <CustomerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        customerId={selectedId}
        onSuccess={handleUpdate}
      />

      <div className="hidden">
        <ImportSheet entityType="customers" onImportComplete={handleUpdate}>
          <button data-import-trigger="customers" type="button" />
        </ImportSheet>
      </div>
    </div>
  );
}
