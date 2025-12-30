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
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import TruckSheet from '@/components/trucks/TruckSheet';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import type { BulkEditField } from '@/components/data-table/types';
import { TruckStatus } from '@prisma/client';
import { Plus, Upload, Download } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';

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
  const { can } = usePermissions();
  const router = useRouter();
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  // Sheet State
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetMode, setSheetMode] = React.useState<'create' | 'edit' | 'view'>('view');
  const [selectedTruckId, setSelectedTruckId] = React.useState<string | null>(null);

  const openSheet = (mode: 'create' | 'edit' | 'view', id?: string) => {
    setSheetMode(mode);
    if (id) setSelectedTruckId(id);
    setSheetOpen(true);
  };

  const handleUpdate = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['trucks'] });
    router.refresh();
  }, [queryClient, router]);

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
        {can('trucks.edit') ? (
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
      {/* Header with action buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          {can('data.import') && (
            <ImportSheet
              entityType="trucks"
              onImportComplete={() => {
                handleUpdate();
              }}
            >
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
              Create Truck
            </Button>
          )}
        </div>
      </div>
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
        onExport={handleExport}
      />
      <TruckSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        truckId={selectedTruckId}
        onSuccess={handleUpdate}
      />
    </>
  );
}

