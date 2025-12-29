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
import { locationsTableConfig } from '@/lib/config/entities/locations';
import LocationInlineEdit from '@/components/locations/LocationInlineEdit';
import { apiUrl } from '@/lib/utils';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { bulkDeleteEntities } from '@/lib/actions/bulk-delete';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/export';
import { useQueryClient } from '@tanstack/react-query';

interface LocationData {
  id: string;
  locationNumber: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  contactName?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  pickupCount: number;
  deliveryCount: number;
}

export default function LocationListNew() {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const handleDelete = React.useCallback(async (ids: string[]) => {
    try {
      const result = await bulkDeleteEntities('location', ids);
      if (result.success) {
        toast.success(`Successfully deleted ${result.deletedCount || ids.length} location(s)`);
        queryClient.invalidateQueries({ queryKey: ['locations'] });
        setSelectedIds([]);
      } else {
        toast.error(result.error || 'Failed to delete locations');
      }
    } catch (err) {
      toast.error('Failed to delete locations');
      console.error(err);
    }
  }, [queryClient]);

  const handleExport = React.useCallback(() => {
    toast.info('Export all locations functionality - use the export button in the toolbar');
  }, []);

  const handleImport = React.useCallback(() => {
    console.log('Import locations');
    toast.info('Import functionality coming soon');
  }, []);

  const fetchLocations = async (params: {
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

    const response = await fetch(apiUrl(`/api/locations?${queryParams}`));
    if (!response.ok) throw new Error('Failed to fetch locations');
    const result = await response.json();

    return {
      data: result.data?.locations || result.data || [],
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

  const rowActions = (row: LocationData) => (
    <div className="flex items-center gap-2">
      <Link href={`/dashboard/locations/${row.id}`}>
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
            <ImportDialog entityType="locations">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportDialog>
          )}
          {can('data.export') && (
            <ExportDialog entityType="locations">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          )}
          {can('locations.create') && (
            <Link href="/dashboard/locations/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Location
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTableWrapper
        config={locationsTableConfig}
        fetchData={fetchLocations}
        rowActions={rowActions}
        inlineEditComponent={can('locations.edit') ? LocationInlineEdit : undefined}
        emptyMessage="No locations found. Get started by adding your first location."
        enableColumnVisibility={can('data.column_visibility')}
        enableRowSelection={true}
        onRowSelectionChange={(selection) => {
          const ids = Object.keys(selection).filter((key) => selection[key]);
          setSelectedIds(ids);
        }}
        onDeleteSelected={handleDelete}
        onExportSelected={handleExport}
      />

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedIds}
          onClearSelection={() => setSelectedIds([])}
          entityType="locations"
          bulkEditFields={locationsTableConfig.bulkEditFields}
          customBulkActions={locationsTableConfig.customBulkActions}
          enableBulkEdit={can('locations.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('locations.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={() => {}}
        />
      )}
    </div>
  );
}

