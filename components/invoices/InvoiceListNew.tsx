'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { invoicesTableConfig, getInvoicesTableConfig } from '@/lib/config/entities/invoices';
import InvoiceInlineEdit from './InvoiceInlineEdit';
import InvoiceSheet from './InvoiceSheet';
import { InvoiceDateRangeFilter } from './InvoiceDateRangeFilter';
import { InvoiceSummaryTotals } from './InvoiceSummaryTotals';
import { apiUrl } from '@/lib/utils';
import { convertFiltersToQueryParams } from '@/lib/utils/filter-converter';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { bulkDeleteEntities } from '@/lib/actions/bulk-delete';
import { exportToCSV } from '@/lib/export';

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  loadId?: string | null;
  customer: {
    id: string;
    name: string;
    customerNumber: string;
  };
  invoiceDate: string;
  dueDate: string;
  total: number;
  status: string;
  subtotal: number;
  tax: number;
  paidAmount?: number;
  balance?: number;
  mcNumber?: string | null;
  subStatus?: string | null;
  reconciliationStatus?: string;
  factoringStatus?: string;
  paymentMethod?: string | null;
  factoringCompany?: {
    id: string;
    name: string;
  } | null;
  agingDays?: number;
  agingStatus?: 'NOT_OVERDUE' | 'OVERDUE';
  accrual?: number;
}

export default function InvoiceListNew() {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [fromDate, setFromDate] = React.useState<string>('');
  const [toDate, setToDate] = React.useState<string>('');
  const [summaryTotals, setSummaryTotals] = React.useState<{
    filtered: { accrual: number; paid: number; balance: number };
    grand?: { accrual: number; paid: number; balance: number };
  } | null>(null);

  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const handleViewInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    setIsSheetOpen(true);
  };

  const config = React.useMemo(() => getInvoicesTableConfig(handleViewInvoice), []);

  const handleDelete = React.useCallback(async (ids: string[]) => {
    try {
      const result = await bulkDeleteEntities('invoice', ids);
      if (result.success) {
        toast.success(`Successfully deleted ${result.deletedCount || ids.length} invoice(s)`);
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        setSelectedIds([]);
      } else {
        toast.error(result.error || 'Failed to delete invoices');
      }
    } catch (err) {
      toast.error('Failed to delete invoices');
      console.error(err);
    }
  }, [queryClient]);

  const handleExport = React.useCallback(() => {
    toast.info('Export all invoices functionality - use the export button in the toolbar');
  }, []);

  const handleImport = React.useCallback(() => {
    console.log('Import invoices');
    toast.info('Import functionality coming soon');
  }, []);

  const fetchInvoices = async (params: {
    page?: number;
    pageSize?: number;
    sorting?: SortingState;
    filters?: ColumnFiltersState;
    search?: string;
    startDate?: string;
    endDate?: string;
    [key: string]: any;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.pageSize) queryParams.set('limit', params.pageSize.toString());

    // Add date range filters from params (passed via queryParams prop)
    if (params.startDate) {
      queryParams.set('startDate', params.startDate);
    }
    if (params.endDate) {
      queryParams.set('endDate', params.endDate);
    }

    // Convert filters and search to query params
    const filterParams = convertFiltersToQueryParams(params.filters || [], params.search);
    filterParams.forEach((value, key) => {
      if (queryParams.has(key)) {
        queryParams.append(key, value);
      } else {
        queryParams.set(key, value);
      }
    });

    const response = await fetch(apiUrl(`/api/invoices?${queryParams}`));
    if (!response.ok) throw new Error('Failed to fetch invoices');
    const result = await response.json();

    // Store summary totals
    if (result.meta?.totals) {
      setSummaryTotals(result.meta.totals);
    }

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

  const rowActions = (row: InvoiceData) => {
    const handleCancel = async () => {
      if (!confirm('Invoices are financial records and cannot be deleted. Would you like to cancel this invoice instead? This will mark it as CANCELLED status.')) {
        return;
      }

      try {
        const response = await fetch(apiUrl(`/api/invoices/${row.id}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CANCELLED' }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to cancel invoice');
        }

        toast.success('Invoice cancelled successfully');
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to cancel invoice');
      }
    };

    return (
      <div className="flex items-center gap-2">
        {can('invoices.edit') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-destructive hover:text-destructive"
            title="Cancel Invoice (Financial records cannot be deleted)"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewInvoice(row.id)}
        >
          View
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          {can('data.import') && (
            <ImportSheet
              entityType="invoices"
              onImportComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['invoices'] });
              }}
            >
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportSheet>
          )}
          {can('data.export') && (
            <ExportDialog entityType="invoices">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          )}
          {can('invoices.create') && (
            <Link href="/dashboard/invoices/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Date Range Filter */}
      <InvoiceDateRangeFilter
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={(date) => {
          setFromDate(date);
          // Refetch will happen automatically when DataTableWrapper calls fetchInvoices with new params
        }}
        onToDateChange={(date) => {
          setToDate(date);
          // Refetch will happen automatically when DataTableWrapper calls fetchInvoices with new params
        }}
      />

      {/* Data Table */}
      <DataTableWrapper
        config={config}
        fetchData={fetchInvoices}
        queryParams={{
          ...(fromDate && { startDate: fromDate }),
          ...(toDate && { endDate: toDate }),
        }}
        rowActions={rowActions}
        onRowClick={(row) => handleViewInvoice(row.id)}
        inlineEditComponent={can('invoices.edit') ? InvoiceInlineEdit : undefined}
        emptyMessage="No invoices found. Get started by creating your first invoice."
        enableColumnVisibility={can('data.column_visibility')}
        enableRowSelection={true}
        onRowSelectionChange={(selection) => {
          const ids = Object.keys(selection).filter((key) => selection[key]);
          setSelectedIds(ids);
        }}
        onDeleteSelected={handleDelete}
        onExportSelected={handleExport}
      />

      {/* Summary Totals */}
      {summaryTotals && (
        <InvoiceSummaryTotals
          filteredTotals={summaryTotals.filtered}
          grandTotals={summaryTotals.grand}
        />
      )}

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedIds}
          onClearSelection={() => setSelectedIds([])}
          entityType="invoices"
          bulkEditFields={invoicesTableConfig.bulkEditFields}
          customBulkActions={invoicesTableConfig.customBulkActions}
          enableBulkEdit={can('invoices.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('invoices.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
          }}
        />
      )}

      <InvoiceSheet
        invoiceId={selectedInvoiceId}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
    </div>
  );
}

