'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download, Edit, Sparkles } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import LoadSheet from '@/components/loads/LoadSheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, FileText } from 'lucide-react';
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
  const [initialCreateData, setInitialCreateData] = React.useState<any>(undefined);

  const openSheet = (mode: 'create' | 'edit' | 'view', id?: string) => {
    setSheetMode(mode);
    if (id) setSelectedLoadId(id);
    if (mode === 'create') setInitialCreateData(undefined); // Reset
    setSheetOpen(true);
  };


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
      // Build sort fields array
      const sortFields: string[] = [];
      const sortOrders: string[] = [];

      params.sorting.forEach((sort) => {
        const sortField = sort.id === 'createdAt' ? 'createdAt' :
          sort.id === 'loadNumber' ? 'loadNumber' :
            sort.id === 'pickupDate' ? 'pickupDate' :
              sort.id === 'deliveryDate' ? 'deliveryDate' :
                sort.id === 'revenue' ? 'revenue' :
                  sort.id === 'customer' ? 'customerId' :
                    sort.id === 'driver' ? 'driverId' :
                      sort.id === 'truck' ? 'truckId' :
                        sort.id === 'status' ? 'status' :
                          sort.id;
        sortFields.push(sortField);
        sortOrders.push(sort.desc ? 'desc' : 'asc');
      });

      // If only pickupDate, add deliveryDate as secondary sort
      if (sortFields.length === 1 && sortFields[0] === 'pickupDate') {
        sortFields.push('deliveryDate');
        sortOrders.push(sortOrders[0]); // Same order as primary
      }
      // If only deliveryDate, add pickupDate as secondary sort
      if (sortFields.length === 1 && sortFields[0] === 'deliveryDate') {
        sortFields.push('pickupDate');
        sortOrders.push(sortOrders[0]);
      }

      queryParams.set('sortBy', sortFields.join(','));
      queryParams.set('sortOrder', sortOrders.join(','));
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


  return (
    <div className="space-y-2">
      {/* Header - Compact */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Quick filters removed as requested */}
        </div>
        <div className="flex items-center gap-1">
          {can('data.import') && (
            <ImportSheet
              entityType="loads"
              onImportComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['loads'] });
                toast.success('Import completed successfully');
              }}
              onAIImport={(data, file) => {
                setInitialCreateData(data);
                setSheetMode('create');
                setSheetOpen(true);
                // Note: File handling would need extra logic to attach 'file' to the form or state
                if (file) {
                  toast.success('Data extracted. Please review and save.');
                }
              }}
            >
              <Button variant="outline" size="sm" className="h-6 text-xs px-2">
                <Upload className="h-3 w-3 mr-1" />
                Import
              </Button>
            </ImportSheet>
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
        onRowClick={(row) => openSheet(can('loads.edit') ? 'edit' : 'view', row.id)}
        emptyMessage="No loads found. Create your first load."
        enableColumnVisibility={can('data.column_visibility')}
        enableRowSelection={true}
        onRowSelectionChange={React.useCallback((selection: Record<string, boolean>) => {
          const ids = Object.keys(selection).filter((key) => selection[key]);
          setSelectedIds(ids);
        }, [])}
        getRowClassName={getLoadRowClassName}
        enableInlineFilters={true}
        enableColumnReorder={true}
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
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setInitialCreateData(undefined); // Clear initial data on close
          }
        }}
        mode={sheetMode}
        loadId={selectedLoadId}
        initialData={initialCreateData}
      />
    </div>
  );
}
