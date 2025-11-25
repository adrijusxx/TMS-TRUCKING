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
import { maintenanceTableConfig } from '@/lib/config/entities/maintenance';
import { apiUrl } from '@/lib/utils';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

interface MaintenanceData {
  id: string;
  type: string;
  description: string;
  cost: number;
  mileage: number;
  scheduledDate: Date | null;
  completedDate: Date | null;
  vendor: string | null;
  invoiceNumber: string | null;
  truck: {
    id: string;
    truckNumber: string;
    make: string;
    model: string;
  };
  createdAt: Date;
}

export default function MaintenanceListNew() {
  const { can } = usePermissions();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const fetchMaintenance = async (params: {
    page?: number;
    pageSize?: number;
    sorting?: SortingState;
    filters?: ColumnFiltersState;
    [key: string]: any;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.pageSize) queryParams.set('limit', params.pageSize.toString());

    // Handle filters
    if (params.filters) {
      params.filters.forEach((filter) => {
        if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
          queryParams.set(filter.id, String(filter.value));
        }
      });
    }

    const response = await fetch(apiUrl(`/api/maintenance?${queryParams}`));
    if (!response.ok) throw new Error('Failed to fetch maintenance records');
    const result = await response.json();

    return {
      data: result.data?.records || result.data || [],
      meta: result.data?.pagination
        ? {
            totalCount: result.data.pagination.total,
            totalPages: result.data.pagination.totalPages,
            page: result.data.pagination.page,
            pageSize: result.data.pagination.limit,
          }
        : result.meta
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

  const rowActions = (row: MaintenanceData) => (
    <div className="flex items-center gap-2">
      <Link href={`/dashboard/fleet/maintenance/${row.id}`}>
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
            <ImportDialog entityType="maintenance">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportDialog>
          )}
          {can('data.export') && (
            <ExportDialog entityType="maintenance">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          )}
          {can('maintenance.create') && (
            <Link href="/dashboard/fleet/maintenance/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Maintenance
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTableWrapper
        config={maintenanceTableConfig}
        fetchData={fetchMaintenance}
        rowActions={rowActions}
        emptyMessage="No maintenance records found. Get started by adding your first maintenance record."
        enableColumnVisibility={can('data.column_visibility')}
        enableRowSelection={true}
        onRowSelectionChange={(selection) => {
          const ids = Object.keys(selection).filter((key) => selection[key]);
          setSelectedIds(ids);
        }}
      />

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedIds}
          onClearSelection={() => setSelectedIds([])}
          entityType="maintenance"
          bulkEditFields={maintenanceTableConfig.bulkEditFields}
          customBulkActions={maintenanceTableConfig.customBulkActions}
          enableBulkEdit={can('maintenance.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('maintenance.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={() => {}}
        />
      )}
    </div>
  );
}

