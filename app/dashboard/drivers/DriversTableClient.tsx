'use client';

import React from 'react';
import { DataTable } from '@/components/data-table/DataTable';
import { createDriverColumns, type DriverData } from './columns';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { bulkDeleteEntities } from '@/lib/actions/bulk-delete';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/export';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import type { BulkEditField } from '@/components/data-table/types';
import { DriverStatus, EmployeeStatus, AssignmentStatus } from '@prisma/client';
import { Plus, Upload, Download } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter, useSearchParams } from 'next/navigation';
import DriverSheet from '@/components/drivers/DriverSheet';



interface DriversTableClientProps {
  data: DriverData[];
}

export function DriversTableClient({ data }: DriversTableClientProps) {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  // Sheet State
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetMode, setSheetMode] = React.useState<'create' | 'edit' | 'view'>('view');
  const [selectedDriverId, setSelectedDriverId] = React.useState<string | null>(null);

  // Deep linking support
  React.useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      openSheet('create');
    } else if (action === 'import') {
      handleImport();
    }

    const driverIdFromUrl = searchParams.get('driverId');
    if (driverIdFromUrl) {
      setSelectedDriverId(driverIdFromUrl);
      setSheetMode(can('drivers.edit') ? 'edit' : 'view');
      setSheetOpen(true);
    }
  }, [searchParams, can]);

  const openSheet = (mode: 'create' | 'edit' | 'view', id?: string) => {
    setSheetMode(mode);
    if (id) setSelectedDriverId(id);
    setSheetOpen(true);
  };

  const handleUpdate = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['drivers'] });
    router.refresh();
  }, [queryClient, router]);

  const handleDelete = React.useCallback(async (ids: string[]) => {
    try {
      const result = await bulkDeleteEntities('driver', ids);
      if (result.success) {
        toast.success(`Successfully deleted ${result.deletedCount || ids.length} driver(s)`);
        queryClient.invalidateQueries({ queryKey: ['drivers'] });
      } else {
        toast.error(result.error || 'Failed to delete drivers');
      }
    } catch (err) {
      toast.error('Failed to delete drivers');
      console.error(err);
    }
  }, [queryClient]);

  const handleExport = React.useCallback(() => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }
    const headers = Object.keys(data[0]);
    exportToCSV(data, headers, `drivers-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(`Exported ${data.length} driver(s)`);
  }, [data]);

  const handleImport = React.useCallback(() => {
    // Trigger import dialog - using a hidden button approach
    const trigger = document.querySelector('[data-import-trigger="drivers"]') as HTMLButtonElement;
    if (trigger) {
      trigger.click();
    }
  }, []);

  const columns = React.useMemo(
    () => createDriverColumns((id) => openSheet(can('drivers.edit') ? 'edit' : 'view', id)),
    [can]
  );

  const rowActions = React.useCallback((row: DriverData) => {
    return (
      <div className="flex items-center gap-2">
        {can('drivers.edit') ? (
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
    exportToCSV(selectedData, headers, `drivers-selected-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(`Exported ${selectedData.length} selected driver(s)`);
  }, [data]);

  const bulkEditFields: BulkEditField[] = React.useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: Object.values(DriverStatus).map(status => ({
        value: status,
        label: status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      })),
    },
    {
      key: 'employeeStatus',
      label: 'Employee Status',
      type: 'select',
      options: Object.values(EmployeeStatus).map(status => ({
        value: status,
        label: status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      })),
    },
    {
      key: 'assignmentStatus',
      label: 'Assignment Status',
      type: 'select',
      options: Object.values(AssignmentStatus).map(status => ({
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

  const selectedRowIds = React.useMemo(() => {
    return Object.keys(rowSelection).filter((key) => rowSelection[key]);
  }, [rowSelection]);

  return (
    <>
      {selectedRowIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedRowIds}
          onClearSelection={() => setRowSelection({})}
          entityType="drivers"
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
              entityType="drivers"
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
            <ExportDialog entityType="drivers">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          )}
          {can('drivers.create') && (
            <Button size="sm" onClick={() => openSheet('create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Driver
            </Button>
          )}
        </div>
      </div>
      <DataTable
        columns={columns}
        data={data}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        enableRowSelection={true}
        rowActions={rowActions}
        onRowClick={(row) => openSheet(can('drivers.edit') ? 'edit' : 'view', row.id)}
        emptyMessage="No drivers found"
        searchPlaceholder="Search by name, email, phone, truck #, driver #..."
        filterKey="firstName,lastName,email,phone,driverNumber,currentTruck.truckNumber"
        onDeleteSelected={handleDeleteSelected}
        onExportSelected={handleExportSelected}
        entityType="drivers"
        enableColumnReorder={true}
      />
      <DriverSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        driverId={selectedDriverId}
        onSuccess={handleUpdate}
      />

      <div className="hidden">
        <ImportSheet
          entityType="drivers"
          onImportComplete={handleUpdate}
        >
          <button data-import-trigger="drivers" type="button" />
        </ImportSheet>
      </div>
    </>
  );
}

