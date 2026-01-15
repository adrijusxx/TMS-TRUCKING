'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText } from 'lucide-react';
// Removed unused import
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import { usePermissions } from '@/hooks/usePermissions';
import SettlementSheet from './SettlementSheet';
import { settlementsTableConfig, getSettlementsTableConfig } from '@/lib/config/entities/settlements';
import { apiUrl } from '@/lib/utils';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { bulkDeleteEntities } from '@/lib/actions/bulk-delete';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/export';
import { useQueryClient } from '@tanstack/react-query';

interface SettlementData {
  id: string;
  settlementNumber: string;
  driver: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
    driverNumber: string;
  };
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  deductions: number;
  advances: number;
  netPay: number;
  status: string;
}

export default function SettlementListNew() {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [selectedSettlementId, setSelectedSettlementId] = React.useState<string | null>(null);

  // Deep linking support
  React.useEffect(() => {
    const settlementIdFromUrl = searchParams.get('settlementId');
    if (settlementIdFromUrl) {
      setSelectedSettlementId(settlementIdFromUrl);
      setSheetOpen(true);
    }
  }, [searchParams]);

  const openSheet = (id: string) => {
    setSelectedSettlementId(id);
    setSheetOpen(true);
    // Optional: Update URL for consistency? Maybe avoid for now to keep it simple
    // window.history.replaceState(null, '', `/dashboard/settlements?settlementId=${id}`);
  };

  const tableConfig = React.useMemo(() => getSettlementsTableConfig(openSheet), []);

  const handleDelete = React.useCallback(async (ids: string[]) => {
    try {
      const result = await bulkDeleteEntities('settlement', ids);
      if (result.success) {
        toast.success(`Successfully deleted ${result.deletedCount || ids.length} settlement(s)`);
        queryClient.invalidateQueries({ queryKey: ['settlements'] });
        setSelectedIds([]);
      } else {
        toast.error(result.error || 'Failed to delete settlements');
      }
    } catch (err) {
      toast.error('Failed to delete settlements');
      console.error(err);
    }
  }, [queryClient]);

  const handleExport = React.useCallback(() => {
    toast.info('Export all settlements functionality - use the export button in the toolbar');
  }, []);

  const handleImport = React.useCallback(() => {
    console.log('Import settlements');
    toast.info('Import functionality coming soon');
  }, []);

  const fetchSettlements = async (params: {
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

    const response = await fetch(apiUrl(`/api/settlements?${queryParams}`));
    if (!response.ok) throw new Error('Failed to fetch settlements');
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

  const rowActions = (row: SettlementData) => (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openSheet(row.id)}
      >
        View
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/settlements/generate">
            <Button size="sm" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Generate Single
            </Button>
          </Link>
          {can('data.import') && (
            <ImportSheet
              entityType="settlements"
              onImportComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['settlements'] });
              }}
            >
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportSheet>
          )}
          {can('data.export') && (
            <ExportDialog entityType="settlements">
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
        config={tableConfig}
        fetchData={fetchSettlements}
        rowActions={rowActions}
        onRowClick={(row) => openSheet(row.id)}
        emptyMessage="No settlements found."
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
          entityType="settlements"
          bulkEditFields={settlementsTableConfig.bulkEditFields}
          customBulkActions={settlementsTableConfig.customBulkActions}
          enableBulkEdit={can('settlements.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('settlements.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={() => { }}
        />
      )}

      <SettlementSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        settlementId={selectedSettlementId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['settlements'] });
        }}
      />
    </div>
  );
}

