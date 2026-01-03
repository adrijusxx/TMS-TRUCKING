'use client';

import React from 'react';
import { DataTable } from '@/components/data-table/DataTable';
import { createTrailerColumns } from './columns';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import TrailerSheet from '@/components/trailers/TrailerSheet';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import type { BulkEditField } from '@/components/data-table/types';
import { Plus, Upload, Download } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';

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
  const { can } = usePermissions();
  const router = useRouter();
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  // Sheet State
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetMode, setSheetMode] = React.useState<'create' | 'edit' | 'view'>('view');
  const [selectedTrailerId, setSelectedTrailerId] = React.useState<string | null>(null);

  const openSheet = (mode: 'create' | 'edit' | 'view', id?: string) => {
    setSheetMode(mode);
    if (id) setSelectedTrailerId(id);
    setSheetOpen(true);
  };

  const handleUpdate = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['trailers'] });
    router.refresh();
  }, [queryClient, router]);



  const columns = React.useMemo(
    () => createTrailerColumns(handleUpdate),
    [handleUpdate]
  );

  const rowActions = React.useCallback((row: TrailerData) => {
    return (
      <div className="flex items-center gap-2">
        {can('trailers.edit') ? (
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
      {/* Header with action buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          {can('data.import') && (
            <ImportSheet
              entityType="trailers"
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
            <ExportDialog entityType="trailers">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          )}
          {can('trailers.create') && (
            <Button size="sm" onClick={() => openSheet('create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Trailer
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
        emptyMessage="No trailers found"
        filterKey="trailerNumber"
        entityType="trailers"
        enableColumnReorder={true}
      />
      <TrailerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        trailerId={selectedTrailerId}
        onSuccess={handleUpdate}
      />
    </>
  );
}

