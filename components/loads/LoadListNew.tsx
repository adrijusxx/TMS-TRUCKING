'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download, Edit, Sparkles } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportDialog from '@/components/import-export/ImportDialog';
import ExportDialog from '@/components/import-export/ExportDialog';
import LoadSheet from '@/components/loads/LoadSheet';
import LoadStatisticsCard from '@/components/loads/LoadStatisticsCard';
import { usePermissions } from '@/hooks/usePermissions';
import { loadsTableConfig, getLoadRowClassName } from '@/lib/config/entities/loads';
import { apiUrl } from '@/lib/utils';
import { convertFiltersToQueryParams } from '@/lib/utils/filter-converter';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { bulkDeleteEntities } from '@/lib/actions/bulk-delete';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface LoadData {
  id: string;
  loadNumber: string;
  status: string;
  mcNumber?: string | {
    id: string;
    number: string;
    companyName?: string;
  } | null;
  customer: {
    id: string;
    name: string;
    customerNumber: string;
  };
  driver?: {
    id: string;
    driverNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  truck?: {
    id: string;
    truckNumber: string;
  };
  dispatcher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  pickupLocation?: string | null;
  pickupCity: string;
  pickupState: string;
  pickupDate: Date | null;
  deliveryLocation?: string | null;
  deliveryCity: string;
  deliveryState: string;
  deliveryDate: Date | null;
  revenue: number;
  driverPay: number;
  profit: number;
  miles: number;
  weight: number | null;
  missingDocuments?: string[];
  hasMissingDocuments?: boolean;
}

export default function LoadListNew() {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [selectedLoadId, setSelectedLoadId] = React.useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetMode, setSheetMode] = React.useState<'create' | 'edit' | 'view'>('view');

  const openSheet = (mode: 'create' | 'edit' | 'view', id?: string) => {
    setSheetMode(mode);
    if (id) setSelectedLoadId(id);
    setSheetOpen(true);
  };

  const [createdToday, setCreatedToday] = React.useState(false);
  const [pickupToday, setPickupToday] = React.useState(false);
  const [createdLast24h, setCreatedLast24h] = React.useState(false);

  const handleDelete = React.useCallback(async (ids: string[]) => {
    try {
      const result = await bulkDeleteEntities('load', ids);
      if (result.success) {
        toast.success(`Deleted ${result.deletedCount || ids.length} load(s)`);
        queryClient.invalidateQueries({ queryKey: ['loads'] });
        setSelectedIds([]);
      } else {
        toast.error(result.error || 'Failed to delete loads');
      }
    } catch (err) {
      toast.error('Failed to delete loads');
      console.error(err);
    }
  }, [queryClient]);

  const handleExport = React.useCallback(() => {
    toast.info('Use the export button in the toolbar');
  }, []);

  const fetchLoads = async (params: {
    page?: number;
    pageSize?: number;
    sorting?: SortingState;
    filters?: ColumnFiltersState;
    search?: string;
    createdToday?: boolean;
    pickupToday?: boolean;
    createdLast24h?: boolean;
    [key: string]: any;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.pageSize) queryParams.set('limit', params.pageSize.toString());

    if (params.sorting && params.sorting.length > 0) {
      const sort = params.sorting[0];
      const sortField = sort.id === 'createdAt' ? 'createdAt' :
        sort.id === 'loadNumber' ? 'loadNumber' :
          sort.id === 'pickupDate' ? 'pickupDate' :
            sort.id === 'deliveryDate' ? 'deliveryDate' :
              sort.id === 'revenue' ? 'revenue' :
                'createdAt';
      queryParams.set('sortBy', sortField);
      queryParams.set('sortOrder', sort.desc ? 'desc' : 'asc');
    } else {
      queryParams.set('sortBy', 'createdAt');
      queryParams.set('sortOrder', 'desc');
    }

    const filterParams = convertFiltersToQueryParams(params.filters || [], params.search);
    filterParams.forEach((value, key) => {
      if (queryParams.has(key)) {
        queryParams.append(key, value);
      } else {
        queryParams.set(key, value);
      }
    });

    if (params.createdToday) queryParams.set('createdToday', 'true');
    if (params.pickupToday) queryParams.set('pickupToday', 'true');
    if (params.createdLast24h) queryParams.set('createdLast24h', 'true');

    const response = await fetch(apiUrl(`/api/loads?${queryParams}`));
    if (!response.ok) throw new Error('Failed to fetch loads');
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

  const rowActions = (row: LoadData) => (
    <div className="flex items-center gap-1">
      {can('loads.edit') ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2"
          onClick={() => openSheet('edit', row.id)}
        >
          Edit
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openSheet('view', row.id)}
          className="h-7 text-xs px-2"
        >
          View
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-2">
      {/* Header - Compact */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Quick:</span>
          <Button
            variant={createdToday ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCreatedToday(!createdToday)}
            className="h-6 text-xs px-2"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Today
          </Button>
          <Button
            variant={pickupToday ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPickupToday(!pickupToday)}
            className="h-6 text-xs px-2"
          >
            Pickup Today
          </Button>
          <Button
            variant={createdLast24h ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCreatedLast24h(!createdLast24h)}
            className="h-6 text-xs px-2"
          >
            Last 24h
          </Button>
          {(createdToday || pickupToday || createdLast24h) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCreatedToday(false);
                setPickupToday(false);
                setCreatedLast24h(false);
              }}
              className="h-6 text-xs px-2"
            >
              Clear
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {can('data.import') && (
            <ImportDialog entityType="loads">
              <Button variant="outline" size="sm" className="h-6 text-xs px-2">
                <Upload className="h-3 w-3 mr-1" />
                Import
              </Button>
            </ImportDialog>
          )}
          {can('data.export') && (
            <ExportDialog entityType="loads">
              <Button variant="outline" size="sm" className="h-6 text-xs px-2">
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </ExportDialog>
          )}
          {can('loads.create') && (
            <Button
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => openSheet('create')}
            >
              <Plus className="h-3 w-3 mr-1" />
              New Load
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Card - Collapsible Header */}
      <LoadStatisticsCard />

      {/* Data Table */}
      <DataTableWrapper
        config={loadsTableConfig}
        fetchData={fetchLoads}
        queryParams={{
          createdToday,
          pickupToday,
          createdLast24h,
        }}
        rowActions={rowActions}
        onRowClick={(row) => openSheet(can('loads.edit') ? 'edit' : 'view', row.id)}
        emptyMessage="No loads found. Create your first load."
        enableColumnVisibility={can('data.column_visibility')}
        enableRowSelection={true}
        onRowSelectionChange={React.useCallback((selection: Record<string, boolean>) => {
          const ids = Object.keys(selection).filter((key) => selection[key]);
          setSelectedIds(ids);
        }, [])}
        getRowClassName={getLoadRowClassName}
        onDeleteSelected={handleDelete}
        onExportSelected={handleExport}
      />

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedIds}
          onClearSelection={() => setSelectedIds([])}
          entityType="loads"
          bulkEditFields={loadsTableConfig.bulkEditFields}
          customBulkActions={loadsTableConfig.customBulkActions}
          enableBulkEdit={can('loads.bulk_edit') || can('data.bulk_edit')}
          enableBulkDelete={can('loads.bulk_delete') || can('data.bulk_delete')}
          enableBulkExport={can('data.export') || can('export.execute')}
          onActionComplete={() => { }}
        />
      )}

      {/* Load Sheet (Unified View/Edit/Create) */}
      <LoadSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        loadId={selectedLoadId}
      />
    </div>
  );
}
