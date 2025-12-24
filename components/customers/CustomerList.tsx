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
import { customersTableConfig } from '@/lib/config/entities/customers';
import CustomerInlineEdit from './CustomerInlineEdit';
import { apiUrl } from '@/lib/utils';
import { convertFiltersToQueryParams } from '@/lib/utils/filter-converter';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

interface CustomerData {
  id: string;
  customerNumber: string;
  name: string;
  type: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  paymentTerms: number;
  totalLoads: number;
  totalRevenue: number;
}

export default function CustomerList() {
  const { can } = usePermissions();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const fetchCustomers = async (params: {
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

    const response = await fetch(apiUrl(`/api/customers?${queryParams}`));
    if (!response.ok) throw new Error('Failed to fetch customers');
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

  const rowActions = (row: CustomerData) => (
    <div className="flex items-center gap-2">
      <Link href={`/dashboard/customers/${row.id}`}>
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
            <ImportDialog entityType="customers">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportDialog>
          )}
          {can('data.export') && (
            <ExportDialog entityType="customers">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          )}
          {can('customers.create') && (
            <Link href="/dashboard/customers/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTableWrapper
        config={customersTableConfig}
        fetchData={fetchCustomers}
        rowActions={rowActions}
        inlineEditComponent={can('customers.edit') ? CustomerInlineEdit : undefined}
        emptyMessage="No customers found. Get started by adding your first customer."
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
          entityType="customers"
          bulkEditFields={customersTableConfig.bulkEditFields}
          customBulkActions={customersTableConfig.customBulkActions}
          enableBulkEdit={can('customers.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('customers.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={() => {}}
        />
      )}
    </div>
  );
}



























