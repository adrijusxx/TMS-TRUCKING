'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ExportDialog from '@/components/import-export/ExportDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { breakdownsTableConfig } from '@/lib/config/entities/breakdowns';
import { apiUrl } from '@/lib/utils';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

interface BreakdownData {
  id: string;
  breakdownNumber: string;
  truck: {
    id: string;
    truckNumber: string;
    make: string;
    model: string;
  };
  load?: {
    id: string;
    loadNumber: string;
  } | null;
  driver?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  breakdownType: string;
  status: string;
  priority: string;
  location: string;
  reportedAt: Date;
  totalCost: number;
  downtimeHours?: number | null;
  mcNumber?: {
    id: string;
    number: string;
    companyName: string;
  } | null;
}

export default function BreakdownHistoryNew() {
  const { can } = usePermissions();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const fetchBreakdowns = async (params: {
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

    const response = await fetch(apiUrl(`/api/breakdowns?${queryParams}`));
    if (!response.ok) throw new Error('Failed to fetch breakdown history');
    const result = await response.json();

    return {
      data: result.data?.breakdowns || result.data || [],
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

  const rowActions = (row: BreakdownData) => (
    <div className="flex items-center gap-2">
      <Link href={`/dashboard/fleet`}>
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
          {can('data.export') && (
            <ExportDialog entityType="breakdowns">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTableWrapper
        config={breakdownsTableConfig}
        fetchData={fetchBreakdowns}
        rowActions={rowActions}
        emptyMessage="No breakdown history found."
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
          entityType="breakdowns"
          bulkEditFields={breakdownsTableConfig.bulkEditFields}
          customBulkActions={breakdownsTableConfig.customBulkActions}
          enableBulkEdit={can('breakdowns.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('breakdowns.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={() => {
            // Refetch will be handled by query invalidation in BulkActionBar
          }}
        />
      )}
    </div>
  );
}

