'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import { useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/hooks/usePermissions';
import { trailersTableConfig } from '@/lib/config/entities/trailers';
import TrailerInlineEdit from './TrailerInlineEdit';
import { apiUrl } from '@/lib/utils';
import { convertFiltersToQueryParams } from '@/lib/utils/filter-converter';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

interface TrailerData {
  id: string;
  trailerNumber: string;
  vin: string | null;
  make: string;
  model: string;
  year: number | null;
  licensePlate: string | null;
  state: string | null;
  mcNumber: {
    id: string;
    number: string;
    companyName: string;
  } | null;
  type: string | null;
  ownership: string | null;
  ownerName: string | null;
  status: string | null;
  fleetStatus: string | null;
  assignedTruck: {
    id: string;
    truckNumber: string;
  } | null;
  operatorDriver: {
    id: string;
    driverNumber: string;
    name: string;
  } | null;
  loadCount: number;
  activeLoads: number;
  lastUsed: Date | null;
  registrationExpiry: Date | null;
  insuranceExpiry: Date | null;
  inspectionExpiry: Date | null;
}

export default function TrailerListNew() {
  const { can } = usePermissions();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const queryClient = useQueryClient();

  const fetchTrailers = async (params: {
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

    // Convert filters and search to query params
    const filterParams = convertFiltersToQueryParams(params.filters || [], params.search);
    filterParams.forEach((value, key) => {
      if (queryParams.has(key)) {
        queryParams.append(key, value);
      } else {
        queryParams.set(key, value);
      }
    });

    const response = await fetch(apiUrl(`/api/trailers?${queryParams}`));
    if (!response.ok) throw new Error('Failed to fetch trailers');
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

  const rowActions = (row: TrailerData) => (
    <div className="flex items-center gap-2">
      <Link href={`/dashboard/trailers/${row.id}`}>
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
            <ImportSheet
              entityType="trailers"
              onImportComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['trailers'] });
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
            <Link href="/dashboard/trailers/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Trailer
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTableWrapper
        config={trailersTableConfig}
        fetchData={fetchTrailers}
        rowActions={rowActions}
        inlineEditComponent={can('trucks.edit') ? TrailerInlineEdit : undefined}
        emptyMessage="No trailers found. Get started by adding your first trailer."
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
          entityType="trailers"
          bulkEditFields={trailersTableConfig.bulkEditFields}
          customBulkActions={trailersTableConfig.customBulkActions}
          enableBulkEdit={can('trailers.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('trailers.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={() => {
            // Refetch will be handled by query invalidation in BulkActionBar
          }}
        />
      )}
    </div>
  );
}

