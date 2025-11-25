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
import { inspectionsTableConfig } from '@/lib/config/entities/inspections';
import { apiUrl } from '@/lib/utils';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

interface InspectionData {
  id: string;
  inspectionNumber: string;
  inspectionType: string;
  inspectionDate: Date;
  status: string;
  defects: number;
  oosStatus: boolean;
  truck: {
    id: string;
    truckNumber: string;
    make: string;
    model: string;
  };
  driver?: {
    id: string;
    driverNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  nextInspectionDue?: Date | null;
}

export default function InspectionListNew() {
  const { can } = usePermissions();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const fetchInspections = async (params: {
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

    // Add search if provided
    if (params.search) {
      queryParams.set('search', params.search);
    }

    const response = await fetch(apiUrl(`/api/inspections?${queryParams}`));
    if (!response.ok) throw new Error('Failed to fetch inspections');
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

  const rowActions = (row: InspectionData) => (
    <div className="flex items-center gap-2">
      <Link href={`/dashboard/fleet/inspections/${row.id}`}>
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
            <ImportDialog entityType="inspections">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportDialog>
          )}
          {can('data.export') && (
            <ExportDialog entityType="inspections">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          )}
          {can('inspections.create') && (
            <Link href="/dashboard/fleet/inspections/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Inspection
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTableWrapper
        config={inspectionsTableConfig}
        fetchData={fetchInspections}
        rowActions={rowActions}
        emptyMessage="No inspections found. Get started by adding your first inspection."
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
          entityType="inspections"
          bulkEditFields={inspectionsTableConfig.bulkEditFields}
          customBulkActions={inspectionsTableConfig.customBulkActions}
          enableBulkEdit={can('inspections.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('inspections.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={() => {}}
        />
      )}
    </div>
  );
}

