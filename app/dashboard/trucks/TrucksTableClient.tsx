'use client';

import React from 'react';
import { DataTable } from '@/components/data-table/DataTable';
import { createTruckColumns } from './columns';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { bulkDeleteEntities } from '@/lib/actions/bulk-delete';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/export';
import ImportDialog from '@/components/import-export/ImportDialog';
import TruckInlineEdit from '@/components/trucks/TruckInlineEdit';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import type { BulkEditField } from '@/components/data-table/types';
import { TruckStatus } from '@prisma/client';

interface TruckData {
  id: string;
  truckNumber: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  state: string;
  equipmentType: string;
  status: any;
  mcNumberId?: string | null;
  mcNumber?: { id: string; number: string } | null;
  createdAt: Date;
  notes?: string | null;
}

interface TrucksTableClientProps {
  data: TruckData[];
}

export function TrucksTableClient({ data }: TrucksTableClientProps) {
  const queryClient = useQueryClient();
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  const handleUpdate = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['trucks'] });
  }, [queryClient]);

  const handleDelete = React.useCallback(async (ids: string[]) => {
    try {
      const result = await bulkDeleteEntities('truck', ids);
      if (result.success) {
        toast.success(`Successfully deleted ${result.deletedCount || ids.length} truck(s)`);
        queryClient.invalidateQueries({ queryKey: ['trucks'] });
      } else {
        toast.error(result.error || 'Failed to delete trucks');
      }
    } catch (err) {
      toast.error('Failed to delete trucks');
      console.error(err);
    }
  }, [queryClient]);

  const handleExport = React.useCallback(() => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }
    const headers = Object.keys(data[0]);
    exportToCSV(data, headers, `trucks-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(`Exported ${data.length} truck(s)`);
  }, [data]);

  const columns = React.useMemo(
    () => createTruckColumns(handleUpdate),
    [handleUpdate]
  );

  const rowActions = React.useCallback((row: TruckData) => {
    return (
      <div className="flex items-center gap-2">
        <Link href={`/dashboard/trucks/${row.id}`}>
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
    exportToCSV(selectedData, headers, `trucks-selected-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(`Exported ${selectedData.length} selected truck(s)`);
  }, [data]);

  const handleImport = React.useCallback(() => {
    const trigger = document.querySelector('[data-import-trigger="trucks"]') as HTMLButtonElement;
    if (trigger) trigger.click();
  }, []);

  const bulkEditFields: BulkEditField[] = React.useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: Object.values(TruckStatus).map(status => ({
        value: status,
        label: status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      })),
    },
    {
      key: 'mcNumberId',
      label: 'MC Number',
      type: 'select',
      placeholder: 'Select MC Number',
    },
  ], []);

  return (
    <>
      {selectedRowIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedRowIds}
          onClearSelection={() => setRowSelection({})}
          entityType="trucks"
          bulkEditFields={bulkEditFields}
          enableBulkEdit={true}
          enableBulkDelete={true}
          enableBulkExport={true}
          onActionComplete={handleUpdate}
        />
      )}
      <DataTable
        columns={columns as any}
        data={data}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        enableRowSelection={true}
        rowActions={rowActions}
        emptyMessage="No trucks found"
        filterKey="truckNumber"
        onDeleteSelected={handleDeleteSelected}
        onExportSelected={handleExportSelected}
        onImport={handleImport}
        onExport={handleExport}
        inlineEditComponent={TruckInlineEdit}
        onInlineEditSave={handleUpdate}
      />
      <div className="hidden">
        <ImportDialog
          entityType="trucks"
          onImportComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['trucks'] });
          }}
        >
          <button data-import-trigger="trucks" type="button" />
        </ImportDialog>
      </div>
    </>
  );
}

