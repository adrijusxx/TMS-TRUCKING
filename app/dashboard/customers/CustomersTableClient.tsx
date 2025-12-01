'use client';

import React from 'react';
import { DataTable } from '@/components/data-table/DataTable';
import { createCustomerColumns } from './columns';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { bulkDeleteEntities } from '@/lib/actions/bulk-delete';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/export';
import ImportDialog from '@/components/import-export/ImportDialog';

interface CustomerData {
  id: string;
  customerNumber: string;
  name: string;
  type: any;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  warning: string | null;
  createdAt: Date;
}

interface CustomersTableClientProps {
  data: CustomerData[];
}

export function CustomersTableClient({ data }: CustomersTableClientProps) {
  const queryClient = useQueryClient();
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  const handleUpdate = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  }, [queryClient]);

  const handleDelete = React.useCallback(async (ids: string[]) => {
    try {
      const result = await bulkDeleteEntities('customer', ids);
      if (result.success) {
        toast.success(`Successfully deleted ${result.deletedCount || ids.length} customer(s)`);
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      } else {
        toast.error(result.error || 'Failed to delete customers');
      }
    } catch (err) {
      toast.error('Failed to delete customers');
      console.error(err);
    }
  }, [queryClient]);

  const handleExport = React.useCallback(() => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }
    const headers = Object.keys(data[0]);
    exportToCSV(data, headers, `customers-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(`Exported ${data.length} customer(s)`);
  }, [data]);

  const columns = React.useMemo(
    () => createCustomerColumns(handleUpdate),
    [handleUpdate]
  );

  const rowActions = React.useCallback((row: CustomerData) => {
    return (
      <div className="flex items-center gap-2">
        <Link href={`/dashboard/customers/${row.id}`}>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </Link>
      </div>
    );
  }, []);

  // Get selected row IDs for bulk actions
  const selectedRowIds = React.useMemo(() => {
    return Object.keys(rowSelection).filter((key) => rowSelection[key]);
  }, [rowSelection]);

  const handleDeleteSelected = React.useCallback((ids: string[]) => {
    handleDelete(ids);
  }, [handleDelete]);

  const handleExportSelected = React.useCallback((ids: string[]) => {
    const selectedData = data.filter((row) => ids.includes(row.id));
    if (selectedData.length === 0) {
      toast.error('No data to export');
      return;
    }
    const headers = Object.keys(selectedData[0]);
    exportToCSV(selectedData, headers, `customers-selected-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(`Exported ${selectedData.length} selected customer(s)`);
  }, [data]);

  const handleImport = React.useCallback(() => {
    const trigger = document.querySelector('[data-import-trigger="customers"]') as HTMLButtonElement;
    if (trigger) trigger.click();
  }, []);

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        enableRowSelection={true}
        rowActions={rowActions}
        emptyMessage="No customers found"
        filterKey="name"
        onDeleteSelected={handleDeleteSelected}
        onExportSelected={handleExportSelected}
        onImport={handleImport}
        onExport={handleExport}
      />
      <div className="hidden">
        <ImportDialog
          entityType="customers"
          onImportComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
          }}
        >
          <button data-import-trigger="customers" type="button" />
        </ImportDialog>
      </div>
    </>
  );
}

