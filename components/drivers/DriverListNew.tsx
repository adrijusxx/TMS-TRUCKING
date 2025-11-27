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
import { driversTableConfig } from '@/lib/config/entities/drivers';
import { apiUrl } from '@/lib/utils';
import { convertFiltersToQueryParams } from '@/lib/utils/filter-converter';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

interface DriverData {
  id: string;
  driverNumber: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: Date;
  medicalCardExpiry: Date;
  drugTestDate: Date | null;
  backgroundCheck: Date | null;
  status: string;
  homeTerminal: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  payType: string;
  payRate: number;
  rating: number | null;
  totalLoads: number;
  totalMiles: number;
  onTimePercentage: number;
  mcNumber?: {
    id: string;
    number: string;
    companyName: string;
  } | null;
  currentTruck?: {
    id: string;
    truckNumber: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

export default function DriverListNew() {
  const { can } = usePermissions();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const fetchDrivers = async (params: {
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

    const response = await fetch(apiUrl(`/api/drivers?${queryParams}`));
    if (!response.ok) throw new Error('Failed to fetch drivers');
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

  const rowActions = (row: DriverData) => (
    <div className="flex items-center gap-2">
      <Link href={`/dashboard/drivers/${row.id}`}>
        <Button variant="ghost" size="sm">
          Edit
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
            <ImportDialog entityType="drivers">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportDialog>
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
            <Link href="/dashboard/drivers/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Driver
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTableWrapper
        config={driversTableConfig}
        fetchData={fetchDrivers}
        rowActions={rowActions}
        emptyMessage="No drivers found. Get started by adding your first driver."
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
          entityType="drivers"
          bulkEditFields={driversTableConfig.bulkEditFields}
          customBulkActions={driversTableConfig.customBulkActions}
          enableBulkEdit={can('drivers.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('drivers.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={() => {}}
        />
      )}
    </div>
  );
}

