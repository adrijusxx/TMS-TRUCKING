'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download, Edit, Sparkles } from 'lucide-react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import ImportDialog from '@/components/import-export/ImportDialog';
import ExportDialog from '@/components/import-export/ExportDialog';
import LoadDetailDialog from '@/components/loads/LoadDetailDialog';
import LoadStatisticsCard from '@/components/loads/LoadStatisticsCard';
import LoadInlineEdit from '@/components/loads/LoadInlineEdit';
import { usePermissions } from '@/hooks/usePermissions';
import { loadsTableConfig, getLoadRowClassName } from '@/lib/config/entities/loads';
import { apiUrl } from '@/lib/utils';
import { convertFiltersToQueryParams } from '@/lib/utils/filter-converter';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';

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
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [selectedLoadId, setSelectedLoadId] = React.useState<string | null>(null);
  const [createdToday, setCreatedToday] = React.useState(false);
  const [pickupToday, setPickupToday] = React.useState(false);
  const [createdLast24h, setCreatedLast24h] = React.useState(false);

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

    // Handle sorting - default to createdAt desc (newest first)
    if (params.sorting && params.sorting.length > 0) {
      const sort = params.sorting[0];
      const sortField = sort.id === 'createdAt' ? 'createdAt' : 
                       sort.id === 'loadNumber' ? 'loadNumber' :
                       sort.id === 'pickupDate' ? 'pickupDate' :
                       sort.id === 'deliveryDate' ? 'deliveryDate' :
                       sort.id === 'revenue' ? 'revenue' :
                       'createdAt'; // Default fallback
      queryParams.set('sortBy', sortField);
      queryParams.set('sortOrder', sort.desc ? 'desc' : 'asc');
    } else {
      // Default: newest first
      queryParams.set('sortBy', 'createdAt');
      queryParams.set('sortOrder', 'desc');
    }

    // Convert filters and search to query params using the converter
    const filterParams = convertFiltersToQueryParams(params.filters || [], params.search);
    filterParams.forEach((value, key) => {
      // Handle multiple values for same key (e.g., status[]=x&status[]=y)
      if (queryParams.has(key)) {
        queryParams.append(key, value);
      } else {
        queryParams.set(key, value);
      }
    });

    // Add quick filter params - read from params object (passed from DataTableWrapper)
    if (params.createdToday) queryParams.set('createdToday', 'true');
    if (params.pickupToday) queryParams.set('pickupToday', 'true');
    if (params.createdLast24h) queryParams.set('createdLast24h', 'true');

    // Debug: Log quick filter params being sent
    console.log('[LoadListNew] Quick filter params:', {
      createdToday: params.createdToday,
      pickupToday: params.pickupToday,
      createdLast24h: params.createdLast24h,
      queryString: queryParams.toString(),
    });

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
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSelectedLoadId(row.id)}
      >
        View
      </Button>
      {can('loads.edit') && (
        <Link href={`/dashboard/loads/${row.id}/edit`}>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </Link>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            {can('data.import') && (
              <ImportDialog entityType="loads">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </ImportDialog>
            )}
            {can('data.export') && (
              <ExportDialog entityType="loads">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </ExportDialog>
            )}
            {can('loads.create') && (
              <Link href="/dashboard/loads/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Load
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        {/* Quick Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Quick Filters:</span>
          <Button
            variant={createdToday ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCreatedToday(!createdToday)}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Created Today
          </Button>
          <Button
            variant={pickupToday ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPickupToday(!pickupToday)}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Pickup Today
          </Button>
          <Button
            variant={createdLast24h ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCreatedLast24h(!createdLast24h)}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Created Last 24h
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
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

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
        onRowClick={(row) => setSelectedLoadId(row.id)}
        inlineEditComponent={can('loads.edit') ? LoadInlineEdit : undefined}
        emptyMessage="No loads found. Get started by creating your first load."
        enableColumnVisibility={can('data.column_visibility')}
        enableRowSelection={true}
        onRowSelectionChange={React.useCallback((selection: Record<string, boolean>) => {
          const ids = Object.keys(selection).filter((key) => selection[key]);
          setSelectedIds(ids);
        }, [])}
        getRowClassName={getLoadRowClassName}
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
          onActionComplete={() => {}}
        />
      )}

      {/* Load Detail Dialog */}
      <LoadDetailDialog
        loadId={selectedLoadId}
        open={!!selectedLoadId}
        onOpenChange={(open) => {
          if (!open) setSelectedLoadId(null);
        }}
      />

      {/* Statistics Card */}
      <LoadStatisticsCard />
    </div>
  );
}

