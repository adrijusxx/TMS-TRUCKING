'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/data-table/DataTable';
import { createCustomerColumns } from './columns';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { bulkDeleteEntities } from '@/lib/actions/bulk-delete';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/export';
import ImportSheet from '@/components/import-export/ImportSheet';

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

import { Plus } from 'lucide-react';
import CustomerSheet from '@/components/customers/CustomerSheet';
import { usePermissions } from '@/hooks/usePermissions';

// ... (existing imports, keep them)

export function CustomersTableClient({ data }: CustomersTableClientProps) {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  // Sheet State
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetMode, setSheetMode] = React.useState<'create' | 'edit' | 'view'>('view');
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(null);

  const openSheet = (mode: 'create' | 'edit' | 'view', id?: string) => {
    setSheetMode(mode);
    if (id) setSelectedCustomerId(id);
    setSheetOpen(true);
  };

  const router = useRouter();

  const handleUpdate = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    router.refresh();
  }, [queryClient, router]);

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

  const columns = React.useMemo(
    () => createCustomerColumns(handleUpdate),
    [handleUpdate]
  );

  const rowActions = React.useCallback((row: CustomerData) => {
    return (
      <div className="flex items-center gap-2">
        {can('customers.edit') ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openSheet('edit', row.id)}
          >
            Edit
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openSheet('view', row.id)}
          >
            View
          </Button>
        )}
      </div>
    );
  }, [can]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {can('customers.create') && (
          <Button onClick={() => openSheet('create')}>
            <Plus className="mr-2 h-4 w-4" />
            New Customer
          </Button>
        )}
      </div>

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
        entityType="customers"
        enableColumnReorder={true}
      />

      <CustomerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        customerId={selectedCustomerId}
        onSuccess={handleUpdate}
      />

      <div className="hidden">
        <ImportSheet
          entityType="customers"
          onImportComplete={() => {
            handleUpdate();
          }}
        >
          <button data-import-trigger="customers" type="button" />
        </ImportSheet>
      </div>
    </div>
  );
}

