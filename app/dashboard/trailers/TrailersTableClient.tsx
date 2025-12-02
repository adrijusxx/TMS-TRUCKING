'use client';

import React from 'react';
import { DataTable } from '@/components/data-table/DataTable';
import { createTrailerColumns } from './columns';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { bulkDeleteEntities } from '@/lib/actions/bulk-delete';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/export';
import ImportDialog from '@/components/import-export/ImportDialog';
import TrailerInlineEdit from '@/components/trailers/TrailerInlineEdit';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import type { BulkEditField } from '@/components/data-table/types';

interface TrailerData {
  id: string;
  trailerNumber: string;
  vin: string | null;
  make: string;
  model: string;
  year: number | null;
  licensePlate: string | null;
  state: string | null;
  type: string | null;
  status: string | null;
  fleetStatus: string | null;
  mcNumberId?: string | null;
  mcNumber?: { id: string; number: string } | null;
  assignedTruckId?: string | null;
  assignedTruck?: { id: string; truckNumber: string } | null;
  createdAt: Date;
  notes?: string | null;
}

interface TrailersTableClientProps {
  data: TrailerData[];
}

export function TrailersTableClient({ data }: TrailersTableClientProps) {
  const queryClient = useQueryClient();
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  const handleUpdate = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['trailers'] });
  }, [queryClient]);

  const handleDelete = React.useCallback(async (ids: string[]) => {
    try {
      const result = await bulkDeleteEntities('trailer', ids);
      if (result.success) {
        toast.success(`Successfully deleted ${result.deletedCount || ids.length} trailer(s)`);
        queryClient.invalidateQueries({ queryKey: ['trailers'] });
      } else {
        toast.error(result.error || 'Failed to delete trailers');
      }
    } catch (err) {
      toast.error('Failed to delete trailers');
      console.error(err);
    }
  }, [queryClient]);

  const handleExport = React.useCallback(() => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }
    const headers = Object.keys(data[0]);
    exportToCSV(data, headers, `trailers-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(`Exported ${data.length} trailer(s)`);
  }, [data]);

  const columns = React.useMemo(
    () => createTrailerColumns(handleUpdate),
    [handleUpdate]
  );

  const rowActions = React.useCallback((row: TrailerData) => {
    return (
      <div className="flex items-center gap-2">
        <Link href={`/dashboard/trailers/${row.id}`}>
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
    exportToCSV(selectedData, headers, `trailers-selected-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(`Exported ${selectedData.length} selected trailer(s)`);
  }, [data]);

  const handleImport = React.useCallback(() => {
    const trigger = document.querySelector('[data-import-trigger="trailers"]') as HTMLButtonElement;
    if (trigger) trigger.click();
  }, []);

  const bulkEditFields: BulkEditField[] = React.useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'AVAILABLE', label: 'Available' },
        { value: 'IN_USE', label: 'In Use' },
        { value: 'MAINTENANCE', label: 'Maintenance' },
        { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
      ],
    },
    {
      key: 'fleetStatus',
      label: 'Fleet Status',
      type: 'select',
      options: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' },
        { value: 'SOLD', label: 'Sold' },
        { value: 'RETIRED', label: 'Retired' },
      ],
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
          entityType="trailers"
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
        emptyMessage="No trailers found"
        filterKey="trailerNumber"
        onDeleteSelected={handleDeleteSelected}
        onExportSelected={handleExportSelected}
        onImport={handleImport}
        onExport={handleExport}
        inlineEditComponent={TrailerInlineEdit}
        onInlineEditSave={handleUpdate}
      />
      <div className="hidden">
        <ImportDialog
          entityType="trailers"
          onImportComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['trailers'] });
          }}
        >
          <button data-import-trigger="trailers" type="button" />
        </ImportDialog>
      </div>
    </>
  );
}

