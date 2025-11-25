'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download, Edit } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportDialog from '@/components/import-export/ImportDialog';
import ExportDialog from '@/components/import-export/ExportDialog';
import LoadDetailDialog from '@/components/loads/LoadDetailDialog';
import LoadStatisticsCard from '@/components/loads/LoadStatisticsCard';
import LoadInlineEdit from '@/components/loads/LoadInlineEdit';
import { usePermissions } from '@/hooks/usePermissions';
import { loadsTableConfig } from '@/lib/config/entities/loads';
import { apiUrl } from '@/lib/utils';
import { convertFiltersToQueryParams } from '@/lib/utils/filter-converter';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

interface LoadData {
  id: string;
  loadNumber: string;
  status: string;
  mcNumber?: string | {
    id: string;
    number: string;
    companyName?: string;
  } | null;
  customer: {
    id: string;
    name: string;
    customerNumber: string;
  };
  driver?: {
    id: string;
    driverNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  truck?: {
    id: string;
    truckNumber: string;
  };
  dispatcher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  pickupLocation?: string | null;
  pickupCity: string;
  pickupState: string;
  pickupDate: Date | null;
  deliveryLocation?: string | null;
  deliveryCity: string;
  deliveryState: string;
  deliveryDate: Date | null;
  revenue: number;
  driverPay: number;
  profit: number;
  miles: number;
  weight: number | null;
}

export default function LoadListNew() {
  const { can } = usePermissions();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [selectedLoadId, setSelectedLoadId] = React.useState<string | null>(null);

  const fetchLoads = async (params: {
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

    // Convert filters and search to query params using the converter
    const filterParams = convertFiltersToQueryParams(params.filters || [], params.search);
    filterParams.forEach((value, key) => {
      // Handle multiple values for same key (e.g., status[]=x&status[]=y)
      if (queryParams.has(key)) {
        queryParams.append(key, value);
      } else {
        queryParams.set(key, value);
      }
    });

    const response = await fetch(apiUrl(`/api/loads?${queryParams}`));
    if (!response.ok) throw new Error('Failed to fetch loads');
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

  const rowActions = (row: LoadData) => (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSelectedLoadId(row.id)}
      >
        View
      </Button>
      {can('loads.edit') && (
        <Link href={`/dashboard/loads/${row.id}/edit`}>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </Link>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          {can('data.import') && (
            <ImportDialog entityType="loads">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportDialog>
          )}
          {can('data.export') && (
            <ExportDialog entityType="loads">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          )}
          {can('loads.create') && (
            <Link href="/dashboard/loads/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Load
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTableWrapper
        config={loadsTableConfig}
        fetchData={fetchLoads}
        rowActions={rowActions}
        onRowClick={(row) => setSelectedLoadId(row.id)}
        inlineEditComponent={can('loads.edit') ? LoadInlineEdit : undefined}
        emptyMessage="No loads found. Get started by creating your first load."
        enableColumnVisibility={can('data.column_visibility')}
        enableRowSelection={true}
        onRowSelectionChange={React.useCallback((selection: Record<string, boolean>) => {
          const ids = Object.keys(selection).filter((key) => selection[key]);
          setSelectedIds(ids);
        }, [])}
      />

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedIds}
          onClearSelection={() => setSelectedIds([])}
          entityType="loads"
          bulkEditFields={loadsTableConfig.bulkEditFields}
          customBulkActions={loadsTableConfig.customBulkActions}
          enableBulkEdit={can('loads.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('loads.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={() => {}}
        />
      )}

      {/* Load Detail Dialog */}
      <LoadDetailDialog
        loadId={selectedLoadId}
        open={!!selectedLoadId}
        onOpenChange={(open) => {
          if (!open) setSelectedLoadId(null);
        }}
      />

      {/* Statistics Card */}
      <LoadStatisticsCard />
    </div>
  );
}

