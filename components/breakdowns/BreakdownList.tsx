'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import { breakdownsTableConfig, type BreakdownData } from '@/lib/config/entities/breakdowns';
import { createEntityFetcher } from '@/lib/utils/entity-fetcher';
import BreakdownInlineEdit from './BreakdownInlineEdit';
import { useEntityList } from '@/hooks/useEntityList';

const fetchBreakdowns = createEntityFetcher<BreakdownData>({
  endpoint: '/api/breakdowns',
  dataKey: 'breakdowns',
  defaultSortBy: 'reportedAt',
  defaultSortOrder: 'desc',
});

export default function BreakdownList() {
  const {
    handleUpdate,
    rowSelection,
    setRowSelection,
    selectedRowIds,
    can,
  } = useEntityList({
    entityType: 'breakdowns',
    editPermission: 'breakdowns.edit',
    idParam: 'breakdownId',
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          {can('data.import') && (
            <ImportSheet entityType="breakdowns" onImportComplete={handleUpdate}>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportSheet>
          )}
          {can('data.export') && (
            <ExportDialog entityType="breakdowns">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          )}
          {can('breakdowns.create') && (
            <Link href="/dashboard/breakdowns/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Breakdown
              </Button>
            </Link>
          )}
        </div>
      </div>

      <DataTableWrapper
        config={breakdownsTableConfig as any}
        fetchData={fetchBreakdowns}
        inlineEditComponent={can('breakdowns.edit') ? BreakdownInlineEdit : undefined}
        emptyMessage="No breakdowns found. Get started by reporting your first breakdown."
        enableColumnVisibility={can('data.column_visibility')}
        enableRowSelection={true}
        onRowSelectionChange={React.useCallback((selection: Record<string, boolean>) => {
          setRowSelection(selection);
        }, [setRowSelection])}
      />

      {selectedRowIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedRowIds}
          onClearSelection={() => setRowSelection({})}
          entityType="breakdowns"
          bulkEditFields={breakdownsTableConfig.bulkEditFields}
          customBulkActions={breakdownsTableConfig.customBulkActions}
          enableBulkEdit={can('breakdowns.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('breakdowns.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={handleUpdate}
        />
      )}
    </div>
  );
}
