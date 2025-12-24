'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportDialog from '@/components/import-export/ImportDialog';
import ExportDialog from '@/components/import-export/ExportDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { trucksTableConfig } from '@/lib/config/entities/trucks';
import TruckInlineEdit from './TruckInlineEdit';
import { apiUrl } from '@/lib/utils';
import { convertFiltersToQueryParams } from '@/lib/utils/filter-converter';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

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
  status: string;
  currentDrivers: Array<{
    id: string;
    driverNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  }>;
  odometerReading: number | null | undefined;
  mcNumber?: {
    id: string;
    number: string;
  };
}

export default function TruckList() {
  const { can } = usePermissions();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const fetchTrucks = async (params: {
    page?: number;
    pageSize?: number;
    sorting?: SortingState;
    filters?: ColumnFiltersState;
    search?: string;
    [key: string]: any;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.pageSize) queryParams.set('limit', params.pageSize.toString());

    // Handle sorting
    if (params.sorting && params.sorting.length > 0) {
      const sort = params.sorting[0];
      // Convert TanStack Table sorting to API format if needed
      // For now, we'll pass it as-is and let the API handle it
    }

    // Convert filters and search to query params
    const filterParams = convertFiltersToQueryParams(params.filters || [], params.search);
    filterParams.forEach((value, key) => {
      // Handle multiple values for same key (e.g., status[]=x&status[]=y)
      if (queryParams.has(key)) {
        queryParams.append(key, value);
      } else {
        queryParams.set(key, value);
      }
    });

    const response = await fetch(apiUrl(`/api/trucks?${queryParams}`));
    if (!response.ok) throw new Error('Failed to fetch trucks');
    const result = await response.json();

    return {
      data: result.data || [],
      meta: result.meta
        ? {
            totalCount: result.meta.total,
            totalPages: result.meta.totalPages,
            page: result.meta.page,
            pageSize: result.meta.limit,
          }
        : {
            totalCount: result.data?.length || 0,
            totalPages: 1,
            page: params.page || 1,
            pageSize: params.pageSize || 20,
          },
    };
  };

  const rowActions = (row: TruckData) => (
    <div className="flex items-center gap-2">
      <Link href={`/dashboard/trucks/${row.id}`}>
        <Button variant="ghost" size="sm">
          View
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          {can('data.import') && (
            <ImportDialog entityType="trucks">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportDialog>
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
            <Link href="/dashboard/trucks/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Truck
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTableWrapper
        config={trucksTableConfig}
        fetchData={fetchTrucks}
        rowActions={rowActions}
        inlineEditComponent={can('trucks.edit') ? TruckInlineEdit : undefined}
        emptyMessage="No trucks found. Get started by adding your first truck."
        enableColumnVisibility={can('data.column_visibility')}
        enableRowSelection={true}
        onRowSelectionChange={React.useCallback((selection: Record<string, boolean>) => {
          const ids = Object.keys(selection).filter((key) => selection[key]);
          console.log('Row selection changed:', { selection, ids, count: ids.length });
          setSelectedIds(ids);
        }, [])}
      />

      {/* Debug: Show selected count */}
      {selectedIds.length > 0 && (
        <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
          Debug: {selectedIds.length} item(s) selected. IDs: {selectedIds.join(', ')}
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedIds}
          onClearSelection={() => setSelectedIds([])}
          entityType="trucks"
          bulkEditFields={trucksTableConfig.bulkEditFields}
          customBulkActions={trucksTableConfig.customBulkActions}
          enableBulkEdit={can('trucks.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('trucks.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={() => {
            // Refetch will be handled by query invalidation in BulkActionBar
          }}
        />
      )}
    </div>
  );
}



























