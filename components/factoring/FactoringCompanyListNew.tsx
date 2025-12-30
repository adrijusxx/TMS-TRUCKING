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
import { factoringCompaniesTableConfig } from '@/lib/config/entities/factoring-companies';
import { apiUrl } from '@/lib/utils';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

interface FactoringCompanyData {
  id: string;
  name: string;
  accountNumber?: string | null;
  reservePercentage: number;
  reserveHoldDays: number;
  apiProvider?: string | null;
  exportFormat?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isActive: boolean;
  _count?: {
    invoices: number;
    customers: number;
  };
}

export default function FactoringCompanyListNew() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const fetchFactoringCompanies = async (params: {
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

    const response = await fetch(apiUrl(`/api/factoring-companies?${queryParams}`));
    if (!response.ok) throw new Error('Failed to fetch factoring companies');
    const result = await response.json();

    // Note: Factoring companies API doesn't have pagination, so we'll handle it client-side
    const data = result.data || [];
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = data.slice(start, end);

    return {
      data: paginatedData,
      meta: {
        totalCount: data.length,
        totalPages: Math.ceil(data.length / pageSize),
        page,
        pageSize,
      },
    };
  };

  const rowActions = (row: FactoringCompanyData) => (
    <div className="flex items-center gap-2">
      <Link href={`/dashboard/accounting/factoring-companies/${row.id}`}>
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
              entityType="factoring-companies"
              onImportComplete={() => queryClient.invalidateQueries({ queryKey: ['factoring-companies'] })}
            >
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportSheet>
          )}
          {can('data.export') && (
            <ExportDialog entityType="factoring-companies">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          )}
          {can('factoring_companies.create') && (
            <Link href="/dashboard/accounting/factoring-companies/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Factoring Company
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTableWrapper
        config={factoringCompaniesTableConfig}
        fetchData={fetchFactoringCompanies}
        rowActions={rowActions}
        emptyMessage="No factoring companies found. Get started by adding your first factoring company."
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
          entityType="factoring-companies"
          bulkEditFields={factoringCompaniesTableConfig.bulkEditFields}
          customBulkActions={factoringCompaniesTableConfig.customBulkActions}
          enableBulkEdit={can('factoring_companies.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('factoring_companies.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={() => { }}
        />
      )}
    </div>
  );
}

