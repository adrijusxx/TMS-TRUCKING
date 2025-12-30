'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { rateConfirmationsTableConfig } from '@/lib/config/entities/rate-confirmations';
import { apiUrl } from '@/lib/utils';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

interface RateConfirmationData {
  id: string;
  loadId: string;
  invoiceId?: string | null;
  rateConfNumber?: string | null;
  baseRate: number;
  fuelSurcharge: number;
  accessorialCharges: number;
  totalRate: number;
  paymentTerms: number;
  paymentMethod?: string | null;
  matchedToInvoice: boolean;
  matchedAt?: Date | null;
  notes?: string | null;
  load: {
    id: string;
    loadNumber: string;
    customer: {
      name: string;
      customerNumber: string;
    };
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    total: number;
  } | null;
  matchedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export default function RateConfirmationListNew() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const fetchRateConfirmations = async (params: {
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

    const response = await fetch(apiUrl(`/api/rate-confirmations?${queryParams}`));
    if (!response.ok) throw new Error('Failed to fetch rate confirmations');
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

  const rowActions = (row: RateConfirmationData) => (
    <div className="flex items-center gap-2">
      <Link href={`/dashboard/accounting/rate-confirmations/${row.id}`}>
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
              entityType="rate-confirmations"
              onImportComplete={() => queryClient.invalidateQueries({ queryKey: ['rate-confirmations'] })}
            >
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportSheet>
          )}
          {can('data.export') && (
            <ExportDialog entityType="rate-confirmations">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          )}
          {can('rate_confirmations.create') && (
            <Link href="/dashboard/accounting/rate-confirmations/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Rate Confirmation
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTableWrapper
        config={rateConfirmationsTableConfig}
        fetchData={fetchRateConfirmations}
        rowActions={rowActions}
        emptyMessage="No rate confirmations found. Get started by creating your first rate confirmation."
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
          entityType="rate-confirmations"
          bulkEditFields={rateConfirmationsTableConfig.bulkEditFields}
          customBulkActions={rateConfirmationsTableConfig.customBulkActions}
          enableBulkEdit={can('rate_confirmations.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('rate_confirmations.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={() => { }}
        />
      )}
    </div>
  );
}

