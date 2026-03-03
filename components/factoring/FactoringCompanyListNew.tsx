'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import { factoringCompaniesTableConfig, type FactoringCompanyData } from '@/lib/config/entities/factoring-companies';
import { createEntityFetcher } from '@/lib/utils/entity-fetcher';
import { useEntityList } from '@/hooks/useEntityList';

const fetchFactoringCompanies = createEntityFetcher<FactoringCompanyData>({
  endpoint: '/api/factoring-companies',
  defaultSortBy: 'name',
  defaultSortOrder: 'asc',
});

export default function FactoringCompanyListNew() {
  const {
    handleUpdate,
    rowSelection,
    setRowSelection,
    selectedRowIds,
    can,
  } = useEntityList({
    entityType: 'factoring-companies',
    editPermission: 'factoring_companies.edit',
    idParam: 'factoringCompanyId',
    queryKey: 'factoring-companies',
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          {can('data.import') && (
            <ImportSheet entityType="factoring-companies" onImportComplete={handleUpdate}>
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

      <DataTableWrapper
        config={factoringCompaniesTableConfig as any}
        fetchData={fetchFactoringCompanies}
        emptyMessage="No factoring companies found. Get started by adding your first factoring company."
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
          entityType="factoring-companies"
          bulkEditFields={factoringCompaniesTableConfig.bulkEditFields}
          customBulkActions={factoringCompaniesTableConfig.customBulkActions}
          enableBulkEdit={can('factoring_companies.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('factoring_companies.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={handleUpdate}
        />
      )}
    </div>
  );
}
