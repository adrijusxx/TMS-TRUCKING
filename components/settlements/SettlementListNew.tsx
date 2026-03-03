'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import SettlementSheet from './SettlementSheet';
import { settlementsTableConfig, getSettlementsTableConfig, type SettlementData } from '@/lib/config/entities/settlements';
import { createEntityFetcher } from '@/lib/utils/entity-fetcher';
import { useEntityList } from '@/hooks/useEntityList';

const fetchSettlements = createEntityFetcher<SettlementData>({
  endpoint: '/api/settlements',
  defaultSortBy: 'createdAt',
  defaultSortOrder: 'desc',
});

export default function SettlementListNew() {
  const {
    sheetOpen,
    setSheetOpen,
    selectedId,
    openSheet,
    handleUpdate,
    handleDelete,
    rowSelection,
    setRowSelection,
    selectedRowIds,
    can,
  } = useEntityList({
    entityType: 'settlements',
    editPermission: 'settlements.edit',
    idParam: 'settlementId',
  });

  const tableConfig = React.useMemo(() => getSettlementsTableConfig(), []);

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
            <ImportSheet entityType="settlements" onImportComplete={handleUpdate}>
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

      <DataTableWrapper
        config={tableConfig as any}
        fetchData={fetchSettlements}
        onRowClick={(row) => openSheet('view', row.id)}
        emptyMessage="No settlements found."
        enableColumnVisibility={can('data.column_visibility')}
        enableRowSelection={true}
        onRowSelectionChange={React.useCallback((selection: Record<string, boolean>) => {
          setRowSelection(selection);
        }, [setRowSelection])}
        onDeleteSelected={handleDelete}
      />

      {selectedRowIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedRowIds}
          onClearSelection={() => setRowSelection({})}
          entityType="settlements"
          bulkEditFields={settlementsTableConfig.bulkEditFields}
          customBulkActions={settlementsTableConfig.customBulkActions}
          enableBulkEdit={can('settlements.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('settlements.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={handleUpdate}
        />
      )}

      <SettlementSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        settlementId={selectedId}
        onSuccess={handleUpdate}
      />
    </div>
  );
}
