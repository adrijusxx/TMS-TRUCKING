'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { exportToCSV, formatDateForExport, formatCurrencyForExport } from '@/lib/export';
import { Package, Plus, Search, Filter, Download, FileText, Edit, MapPin, Trash2, Upload, Settings2, Users, Clock, UserCheck, Navigation, CheckCircle, User, Truck, ArrowRight, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import ExportDialog from '@/components/import-export/ExportDialog';
import BulkActionBar from '@/components/import-export/BulkActionBar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadStatus } from '@prisma/client';
import LoadStatusQuickActions from './LoadStatusQuickActions';
import { DispatchStatusBadge } from './DispatchStatusSelector';
import AdvancedFilters from '@/components/filters/AdvancedFilters';
import SavedFilters from '@/components/filters/SavedFilters';
import BulkStatusUpdate from '@/components/loads/BulkStatusUpdate';
import LoadDetailDialog from '@/components/loads/LoadDetailDialog';
import DocumentViewerDialog from '@/components/loads/DocumentViewerDialog';
import { useKeyboardShortcuts, commonShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/hooks/usePermissions';
import McBadge from '@/components/mc-numbers/McBadge';

interface Load {
  id: string;
  loadNumber: string;
  status: LoadStatus;
  dispatchStatus?: string | null;
  mcNumber?: string | null;
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
    email: string;
  };
  pickupLocation?: string | null;
  pickupCity: string;
  pickupState: string;
  pickupDate: Date;
  deliveryLocation?: string | null;
  deliveryCity: string;
  deliveryState: string;
  deliveryDate?: Date | null;
  revenue: number;
  driverPay?: number | null;
  totalPay?: number | null;
  totalMiles?: number | null;
  loadedMiles?: number | null;
  emptyMiles?: number | null;
  trailerNumber?: string | null;
  shipmentId?: string | null;
  stopsCount?: number | null;
  serviceFee?: number | null;
  stops?: Array<{
    id: string;
    stopType: string;
    sequence: number;
  }>;
  documents?: Array<{
    id: string;
    type: string;
    title: string;
    fileName: string;
    fileUrl: string;
  }>;
  statusHistory?: Array<{
    createdBy: string;
    createdAt: Date;
  }>;
}

interface LoadStats {
  totalPay: number;
  totalLoadPay: number;
  driverGross: number;
  totalMiles: number;
  loadedMiles: number;
  emptyMiles: number;
  rpmLoadedMiles: number | null;
  rpmTotalMiles: number | null;
  serviceFee: number;
}

const statusColors: Record<LoadStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  EN_ROUTE_PICKUP: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  AT_PICKUP: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  LOADED: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  EN_ROUTE_DELIVERY: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
  AT_DELIVERY: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  INVOICED: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  PAID: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
};

function formatStatus(status: LoadStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getStatusIcon(status: LoadStatus) {
  const iconClass = "h-3.5 w-3.5";
  switch (status) {
    case 'PENDING':
      return <Clock className={iconClass} />;
    case 'ASSIGNED':
      return <UserCheck className={iconClass} />;
    case 'EN_ROUTE_PICKUP':
    case 'EN_ROUTE_DELIVERY':
      return <Navigation className={iconClass} />;
    case 'AT_PICKUP':
    case 'AT_DELIVERY':
      return <MapPin className={iconClass} />;
    case 'LOADED':
      return <Package className={iconClass} />;
    case 'DELIVERED':
    case 'INVOICED':
    case 'PAID':
      return <CheckCircle className={iconClass} />;
    case 'CANCELLED':
      return <Trash2 className={iconClass} />;
    default:
      return <Package className={iconClass} />;
  }
}

async function fetchLoads(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  my?: string;
  [key: string]: any;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.status) queryParams.set('status', params.status);
  if (params.search) queryParams.set('search', params.search);
  if (params.my) queryParams.set('my', params.my);
  // MC filtering is handled server-side via cookies, no need to pass in URL

  const response = await fetch(apiUrl(`/api/loads?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch loads');
  return response.json();
}

async function deleteLoad(loadId: string) {
  const response = await fetch(apiUrl(`/api/loads/${loadId}`), {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete load');
  }
  return response.json();
}

async function bulkDeleteLoads(loadIds: string[]) {
  const response = await fetch(apiUrl('/api/loads/bulk'), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loadIds }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete loads');
  }
  return response.json();
}

async function fetchAllLoadIds(
  filters: {
    status?: string;
    search?: string;
    [key: string]: any;
  },
  pageSize: number = 100
): Promise<string[]> {
  const allIds: string[] = [];
  let page = 1;
  const limit = Math.min(pageSize, 100); // Use pageSize but cap at API max limit
  let hasMore = true;

  while (hasMore) {
    const queryParams = new URLSearchParams();
    queryParams.set('limit', limit.toString());
    queryParams.set('page', page.toString());
    if (filters.status && filters.status !== 'all') queryParams.set('status', filters.status);
    if (filters.search) queryParams.set('search', filters.search);
    // Add other filters
    Object.keys(filters).forEach((key) => {
      if (key !== 'status' && key !== 'search' && filters[key]) {
        queryParams.set(key, String(filters[key]));
      }
    });

    const response = await fetch(apiUrl(`/api/loads?${queryParams}`));
    if (!response.ok) throw new Error('Failed to fetch load IDs');
    const data = await response.json();
    const loads = data.data || [];
    allIds.push(...loads.map((load: Load) => load.id));

    // Check if there are more pages
    const meta = data.meta;
    if (meta && page >= meta.totalPages) {
      hasMore = false;
    } else if (loads.length < limit) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return allIds;
}

export default function LoadList() {
  const { can } = usePermissions();
  const searchParams = useSearchParams();
  const view = useMemo(() => {
    return searchParams?.get('view') || 'all';
  }, [searchParams?.toString()]);
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // Default to 50 loads per page
  const [statusFilter, setStatusFilter] = useState<string>(view === 'live' ? 'EN_ROUTE_DELIVERY' : 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dispatcherFilter, setDispatcherFilter] = useState<string>('all');
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
  
  // Update filters when view changes
  useEffect(() => {
    if (view === 'live') {
      // Live loads: active/in-transit loads
      setStatusFilter('IN_TRANSIT');
      setAdvancedFilters({});
      setDispatcherFilter('all');
    } else {
      setStatusFilter('all');
      setAdvancedFilters({});
      setDispatcherFilter('all');
    }
    setPage(1); // Reset to first page when view changes
  }, [view]);
  const [selectedLoadIds, setSelectedLoadIds] = useState<string[]>([]);
  const [selectAllPages, setSelectAllPages] = useState(false);
  const [allLoadIds, setAllLoadIds] = useState<string[]>([]);
  const [isFetchingAllIds, setIsFetchingAllIds] = useState(false);
  const [quickViewLoadId, setQuickViewLoadId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [deleteLoadId, setDeleteLoadId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  // Column visibility state - default view with essential columns
  const [visibleColumns, setVisibleColumns] = useState({
    checkbox: true,
    loadNumber: true,
    customer: true,
    route: true,
    stops: false,
    pickupDate: false,
    deliveryDate: false,
    driver: true,
    dispatcher: true,
    truck: true,
    trailer: true,
    status: true,
    dispatchStatus: true,
    revenue: true,
    driverPay: false,
    serviceFee: false,
    ratePerMile: false,
    miles: true,
    loadedMiles: false,
    emptyMiles: false,
    documents: false,
    actions: true,
  });

  // MC state is managed via cookies, not URL params
  
  const { data: dispatchersData } = useQuery({
    queryKey: ['dispatchers'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/settings/users?role=DISPATCHER'));
      if (!response.ok) throw new Error('Failed to fetch dispatchers');
      return response.json();
    },
  });
  const dispatchers = dispatchersData?.data || [];

  const queryKey = useMemo(
    () => ['loads', page, pageSize, statusFilter, searchQuery, JSON.stringify(advancedFilters), view, dispatcherFilter],
    [page, pageSize, statusFilter, searchQuery, advancedFilters, view, dispatcherFilter]
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const params: any = {
        page,
        limit: pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
        // MC filtering handled server-side via cookies
        dispatcherId: dispatcherFilter !== 'all' ? dispatcherFilter : undefined,
        ...advancedFilters,
      };
      
      const result = await fetchLoads(params);
      console.log('[LoadList] Fetched loads:', { 
        count: result.data?.length || 0, 
        total: result.meta?.total || 0,
        page: result.meta?.page || 1,
        statusFilter,
        searchQuery 
      });
      return result;
    },
  });

  const loads: Load[] = data?.data || [];
  const meta = data?.meta;
  const stats = data?.stats as LoadStats | undefined;
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteLoad,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      toast.success('Load deleted successfully');
      setDeleteLoadId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete load');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteLoads,
    onSuccess: (data) => {
      console.log('[Bulk Delete] Success', data);
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      toast.success(`Successfully deleted ${data.data?.deleted || (selectAllPages ? allLoadIds.length : selectedLoadIds.length)} load(s)`);
      setSelectedLoadIds([]);
      setSelectAllPages(false);
      setAllLoadIds([]);
      setBulkDeleteOpen(false);
    },
    onError: (error: Error) => {
      console.error('[Bulk Delete] Error', error);
      toast.error(error.message || 'Failed to delete loads');
    },
  });

  // Fetch all load IDs when "Select All Pages" is enabled
  const handleSelectAllPages = async () => {
    if (selectAllPages) {
      // Deselect all
      setSelectAllPages(false);
      setAllLoadIds([]);
      setSelectedLoadIds([]);
      return;
    }

    setIsFetchingAllIds(true);
    try {
      const ids = await fetchAllLoadIds(
        {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchQuery || undefined,
          ...advancedFilters,
        },
        pageSize
      );
      console.log('[Select All Pages] Fetched IDs', { count: ids.length, firstFew: ids.slice(0, 5) });
      if (ids.length === 0) {
        toast.warning('No loads found matching current filters');
        return;
      }
      setAllLoadIds(ids);
      setSelectAllPages(true);
      setSelectedLoadIds([]); // Clear page selection
      toast.success(`Selected all ${ids.length} load(s) matching current filters`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch all load IDs');
    } finally {
      setIsFetchingAllIds(false);
    }
  };

  const getSelectedCount = () => {
    if (selectAllPages) {
      return allLoadIds.length;
    }
    return selectedLoadIds.length;
  };

  const getLoadIdsToDelete = () => {
    if (selectAllPages) {
      return allLoadIds;
    }
    return selectedLoadIds;
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...commonShortcuts.newLoad,
      action: () => {
        window.location.href = '/dashboard/loads/new';
      },
    },
    {
      ...commonShortcuts.search,
      action: () => {
        searchInputRef.current?.focus();
      },
    },
    {
      ...commonShortcuts.refresh,
      action: () => {
        refetch();
      },
    },
  ]);

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings2 className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Import/Export</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/dashboard/import/loads">
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Loads
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onSelect={(e) => {
                e.preventDefault();
                setExportDialogOpen(true);
              }}>
                <Download className="h-4 w-4 mr-2" />
                Export Loads
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Selection</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectAllPages}
                onCheckedChange={handleSelectAllPages}
                disabled={isFetchingAllIds}
              >
                {isFetchingAllIds ? 'Loading...' : selectAllPages ? 'Clear All Pages' : 'Select All Pages'}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings2 className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 max-h-[400px] overflow-y-auto">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={visibleColumns.checkbox}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, checkbox: checked })
                }
              >
                Checkbox
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.loadNumber}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, loadNumber: checked })
                }
              >
                Load #
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.customer}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, customer: checked })
                }
              >
                Customer
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.route}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, route: checked })
                }
              >
                Route
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.stops}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, stops: checked })
                }
              >
                Stops
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.pickupDate}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, pickupDate: checked })
                }
              >
                Pickup Date
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.deliveryDate}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, deliveryDate: checked })
                }
              >
                Delivery Date
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.driver}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, driver: checked })
                }
              >
                Driver
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.dispatcher}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, dispatcher: checked })
                }
              >
                Dispatcher
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.truck}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, truck: checked })
                }
              >
                Truck
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.trailer}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, trailer: checked })
                }
              >
                Trailer
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.status}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, status: checked })
                }
              >
                Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.dispatchStatus}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, dispatchStatus: checked })
                }
              >
                Dispatch Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.revenue}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, revenue: checked })
                }
              >
                Revenue
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.driverPay}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, driverPay: checked })
                }
              >
                Driver Pay
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.serviceFee}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, serviceFee: checked })
                }
              >
                Service Fee
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.ratePerMile}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, ratePerMile: checked })
                }
              >
                Rate/Mile
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.miles}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, miles: checked })
                }
              >
                Total Miles
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.loadedMiles}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, loadedMiles: checked })
                }
              >
                Loaded Miles
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.emptyMiles}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, emptyMiles: checked })
                }
              >
                Empty Miles
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.documents}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, documents: checked })
                }
              >
                Documents
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.actions}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, actions: checked })
                }
              >
                Actions
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {can('loads.create') && (
            <Link href="/dashboard/loads/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Load
              </Button>
            </Link>
          )}
        </div>
      </div>


      {/* Bulk Actions */}
      {(selectedLoadIds.length > 0 || selectAllPages) && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectAllPages ? (
              <>
                All {allLoadIds.length} load(s) selected (all pages)
              </>
            ) : (
              <>
                {selectedLoadIds.length} load(s) selected
              </>
            )}
          </span>
          {!selectAllPages && (
            <BulkStatusUpdate
              selectedLoadIds={selectedLoadIds}
              onSuccess={() => setSelectedLoadIds([])}
            />
          )}
          {can('loads.delete') && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                const idsToDelete = getLoadIdsToDelete();
                console.log('[Bulk Delete] Button clicked', {
                  selectAllPages,
                  allLoadIdsCount: allLoadIds.length,
                  selectedLoadIdsCount: selectedLoadIds.length,
                  idsToDeleteCount: idsToDelete.length,
                });
                if (idsToDelete.length === 0) {
                  toast.error('No loads selected to delete');
                  return;
                }
                setBulkDeleteOpen(true);
              }}
              disabled={selectAllPages ? allLoadIds.length === 0 : selectedLoadIds.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectAllPages ? `All ${allLoadIds.length}` : selectedLoadIds.length}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedLoadIds([]);
              setSelectAllPages(false);
              setAllLoadIds([]);
            }}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search by load number or commodity... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <AdvancedFilters
            filters={[
              { 
                field: 'status', 
                label: 'Status', 
                type: 'select',
                options: [
                  { value: 'all', label: 'All Statuses' },
                  ...Object.keys(statusColors).map((status) => ({
                    value: status,
                    label: formatStatus(status as LoadStatus)
                  }))
                ]
              },
              { 
                field: 'dispatcherId', 
                label: 'Dispatcher', 
                type: 'select',
                options: [
                  { value: 'all', label: 'All Dispatchers' },
                  ...dispatchers.map((dispatcher: any) => ({
                    value: dispatcher.id,
                    label: `${dispatcher.firstName} ${dispatcher.lastName}`
                  }))
                ]
              },
              { field: 'customerId', label: 'Customer', type: 'text' },
              { field: 'driverId', label: 'Driver', type: 'text' },
              { field: 'pickupCity', label: 'Pickup City', type: 'text' },
              { field: 'deliveryCity', label: 'Delivery City', type: 'text' },
              { field: 'pickupDate', label: 'Pickup Date', type: 'date' },
              { field: 'revenue', label: 'Min Revenue', type: 'number' },
            ]}
            onApply={(filters) => {
              // Extract status and dispatcher from filters
              const { status, dispatcherId, ...rest } = filters;
              if (status && status !== 'all') {
                setStatusFilter(status);
              } else {
                setStatusFilter('all');
              }
              if (dispatcherId && dispatcherId !== 'all') {
                setDispatcherFilter(dispatcherId);
              } else {
                setDispatcherFilter('all');
              }
              setAdvancedFilters(rest);
              setPage(1);
            }}
            onClear={() => {
              setAdvancedFilters({});
              setStatusFilter('all');
              setDispatcherFilter('all');
              setPage(1);
            }}
            initialValues={{
              status: statusFilter !== 'all' ? statusFilter : undefined,
              dispatcherId: dispatcherFilter !== 'all' ? dispatcherFilter : undefined,
              ...advancedFilters,
            }}
          />
          <SavedFilters
            entityType="loads"
            currentFilters={{ ...advancedFilters, status: statusFilter, search: searchQuery }}
            onApplyFilter={(filters) => {
              // Extract status and search from saved filters
              const { status, search, ...rest } = filters;
              if (status) setStatusFilter(status);
              if (search) setSearchQuery(search);
              setAdvancedFilters(rest);
              setPage(1);
            }}
          />
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(parseInt(value));
              setPage(1); // Reset to first page when changing page size
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
              <SelectItem value="200">200 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading loads...</div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          <p className="font-medium">Error loading loads. Please try again.</p>
          {error instanceof Error && (
            <p className="text-sm mt-2 text-muted-foreground">{error.message}</p>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      ) : loads.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No loads found</p>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first load'}
          </p>
          {!searchQuery && statusFilter === 'all' && can('loads.create') && (
            <Link href="/dashboard/loads/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Load
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.checkbox && <TableHead className="w-12">
                    <Checkbox
                      checked={selectAllPages || (selectedLoadIds.length === loads.length && loads.length > 0 && !selectAllPages)}
                      onCheckedChange={(checked) => {
                        if (checked && !selectAllPages) {
                          // Only select current page if not in "select all pages" mode
                          setSelectedLoadIds(loads.map((load) => load.id));
                        } else if (!selectAllPages) {
                          setSelectedLoadIds([]);
                        }
                      }}
                      disabled={selectAllPages}
                    />
                  </TableHead>}
                  {visibleColumns.loadNumber && <TableHead>Load #</TableHead>}
                  {visibleColumns.customer && <TableHead>Customer</TableHead>}
                  {visibleColumns.route && <TableHead>Route</TableHead>}
                  {visibleColumns.stops && <TableHead>Stops</TableHead>}
                  {visibleColumns.pickupDate && <TableHead>Pickup Date</TableHead>}
                  {visibleColumns.deliveryDate && <TableHead>Delivery Date</TableHead>}
                  {visibleColumns.driver && <TableHead>Driver</TableHead>}
                  {visibleColumns.dispatcher && <TableHead>Dispatcher</TableHead>}
                  {visibleColumns.truck && <TableHead>Truck</TableHead>}
                  {visibleColumns.trailer && <TableHead>Trailer</TableHead>}
                  {visibleColumns.status && <TableHead>Status</TableHead>}
                  {visibleColumns.dispatchStatus && <TableHead>Dispatch Status</TableHead>}
                  {visibleColumns.revenue && <TableHead className="text-right">Revenue</TableHead>}
                  {visibleColumns.driverPay && <TableHead className="text-right">Driver Pay</TableHead>}
                  {visibleColumns.serviceFee && <TableHead className="text-right">Service Fee</TableHead>}
                  {visibleColumns.ratePerMile && <TableHead className="text-right">Rate/Mile</TableHead>}
                  {visibleColumns.miles && <TableHead className="text-right">Total Miles</TableHead>}
                  {visibleColumns.loadedMiles && <TableHead className="text-right">Loaded Miles</TableHead>}
                  {visibleColumns.emptyMiles && <TableHead className="text-right">Empty Miles</TableHead>}
                  {visibleColumns.documents && <TableHead>Docs</TableHead>}
                  {visibleColumns.actions && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loads.map((load) => (
                  <TableRow key={load.id}>
                    {visibleColumns.checkbox && <TableCell className="px-3 py-2">
                      <Checkbox
                        checked={selectAllPages || selectedLoadIds.includes(load.id)}
                        onCheckedChange={(checked) => {
                          if (selectAllPages) {
                            // If in "select all pages" mode, clicking individual checkbox disables it
                            handleSelectAllPages();
                          } else if (checked) {
                            setSelectedLoadIds([...selectedLoadIds, load.id]);
                          } else {
                            setSelectedLoadIds(selectedLoadIds.filter((id) => id !== load.id));
                          }
                        }}
                        disabled={selectAllPages}
                      />
                    </TableCell>}
                    {visibleColumns.loadNumber && <TableCell className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQuickViewLoadId(load.id)}
                          className="text-sm font-medium text-primary hover:underline text-left"
                        >
                          {load.loadNumber}
                        </button>
                        {load.mcNumber && <McBadge mcNumber={load.mcNumber} size="sm" />}
                      </div>
                    </TableCell>}
                    {visibleColumns.customer && <TableCell className="px-3 py-2">
                      <div className="text-sm font-medium">{load.customer.name}</div>
                    </TableCell>}
                    {visibleColumns.route && <TableCell className="px-3 py-2">
                      <div className="text-xs">
                        {(load.pickupCity && load.pickupCity !== 'Unknown' && load.deliveryCity && load.deliveryCity !== 'Unknown') ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{load.pickupCity}, {load.pickupState || ''}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{load.deliveryCity}, {load.deliveryState || ''}</span>
                          </div>
                        ) : load.pickupLocation || load.deliveryLocation ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{load.pickupLocation || 'N/A'}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{load.deliveryLocation || 'N/A'}</span>
                          </div>
                        ) : load.stops && load.stops.length > 0 ? (
                          <div className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{load.stops.filter((s: any) => s.stopType === 'PICKUP').length} pickup(s) → {load.stops.filter((s: any) => s.stopType === 'DELIVERY').length} delivery(ies)</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>}
                    {visibleColumns.stops && <TableCell className="px-3 py-2">
                      {load.stopsCount !== undefined && load.stopsCount !== null ? (
                        <div className="text-xs">
                          <span className="font-medium">{load.stopsCount}</span>
                          {load.stops && load.stops.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {load.stops.filter((s: any) => s.stopType === 'PICKUP').length} pickup /{' '}
                              {load.stops.filter((s: any) => s.stopType === 'DELIVERY').length} delivery
                            </div>
                          )}
                        </div>
                      ) : load.stops && load.stops.length > 0 ? (
                        <div className="text-xs">
                          <span className="font-medium">{load.stops.length}</span>
                          <div className="text-xs text-muted-foreground">
                            {load.stops.filter((s: any) => s.stopType === 'PICKUP').length} pickup /{' '}
                            {load.stops.filter((s: any) => s.stopType === 'DELIVERY').length} delivery
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">1</span>
                      )}
                    </TableCell>}
                    {visibleColumns.pickupDate && <TableCell className="px-3 py-2">
                      <span className="text-xs">{formatDate(load.pickupDate)}</span>
                    </TableCell>}
                    {visibleColumns.deliveryDate && <TableCell className="px-3 py-2">
                      {load.deliveryDate ? (
                        <span className="text-xs">{formatDate(load.deliveryDate)}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.driver && <TableCell className="px-3 py-2">
                      {load.driver ? (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <div className="text-xs">
                            <div className="font-medium">{load.driver.user.firstName} {load.driver.user.lastName}</div>
                            <div className="text-xs text-muted-foreground">{load.driver.driverNumber}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Unassigned</span>
                      )}
                    </TableCell>}
                    {visibleColumns.dispatcher && <TableCell className="px-3 py-2">
                      {load.dispatcher ? (
                        <span className="text-xs">{load.dispatcher.firstName} {load.dispatcher.lastName}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.truck && <TableCell className="px-3 py-2">
                      {load.truck ? (
                        <div className="flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs font-medium">{load.truck.truckNumber}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.trailer && <TableCell className="px-3 py-2">
                      {load.trailerNumber ? (
                        <span className="text-xs font-medium">{load.trailerNumber}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.status && <TableCell className="px-3 py-2">
                      <Badge
                        variant="outline"
                        className={`${statusColors[load.status as LoadStatus]} flex items-center gap-1.5 w-fit`}
                      >
                        {getStatusIcon(load.status as LoadStatus)}
                        <span className="text-xs">{formatStatus(load.status)}</span>
                      </Badge>
                    </TableCell>}
                    {visibleColumns.dispatchStatus && <TableCell className="px-3 py-2">
                      <DispatchStatusBadge status={load.dispatchStatus as any} />
                    </TableCell>}
                    {visibleColumns.revenue && <TableCell className="px-3 py-2 text-right">
                      <div className="text-sm font-medium">{formatCurrency(load.revenue)}</div>
                    </TableCell>}
                    {visibleColumns.driverPay && <TableCell className="px-3 py-2 text-right">
                      {load.driverPay || load.totalPay ? (
                        <div className="text-xs">
                          {load.driverPay ? (
                            <div className="font-medium">{formatCurrency(load.driverPay)}</div>
                          ) : load.totalPay ? (
                            <div className="font-medium">{formatCurrency(load.totalPay)}</div>
                          ) : null}
                          {load.driverPay && load.totalPay && load.driverPay !== load.totalPay && (
                            <div className="text-xs text-muted-foreground">
                              Total: {formatCurrency(load.totalPay)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.serviceFee && <TableCell className="px-3 py-2 text-right">
                      {load.serviceFee ? (
                        <div className="text-xs font-medium">{formatCurrency(load.serviceFee)}</div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.ratePerMile && <TableCell className="px-3 py-2 text-right">
                      {load.totalMiles && load.totalMiles > 0 ? (
                        <div className="text-xs">
                          <div>${(load.revenue / load.totalMiles).toFixed(2)}</div>
                          {load.loadedMiles && load.loadedMiles > 0 && (
                            <div className="text-xs text-muted-foreground">
                              ${(load.revenue / load.loadedMiles).toFixed(2)} loaded
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.miles && <TableCell className="px-3 py-2 text-right">
                      {load.totalMiles ? (
                        <div className="text-xs font-medium">{load.totalMiles.toLocaleString()}</div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.loadedMiles && <TableCell className="px-3 py-2 text-right">
                      {load.loadedMiles ? (
                        <div className="text-xs font-medium">{load.loadedMiles.toLocaleString()}</div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.emptyMiles && <TableCell className="px-3 py-2 text-right">
                      {load.emptyMiles ? (
                        <div className="text-xs font-medium">{load.emptyMiles.toLocaleString()}</div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.documents && <TableCell className="px-3 py-2">
                      {load.documents && load.documents.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                          <span className="text-xs font-medium">{load.documents.length}</span>
                          <DocumentViewerDialog documents={load.documents} loadNumber={load.loadNumber} />
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.actions && <TableCell className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <LoadStatusQuickActions
                          loadId={load.id}
                          currentStatus={load.status}
                        />
                        {can('loads.delete') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteLoadId(load.id)}
                            title="Delete Load"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!deleteLoadId} onOpenChange={(open) => !open && setDeleteLoadId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Load</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this load? This action cannot be undone.
                  {deleteLoadId && (
                    <span className="block mt-2 font-medium">
                      Load: {loads.find(l => l.id === deleteLoadId)?.loadNumber}
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (deleteLoadId) {
                      deleteMutation.mutate(deleteLoadId);
                    }
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Bulk Delete Confirmation Dialog */}
          <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {getSelectedCount()} Load(s)</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {getSelectedCount()} {selectAllPages ? 'load(s) matching current filters' : 'selected load(s)'}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    const idsToDelete = getLoadIdsToDelete();
                    console.log('[Bulk Delete] Confirming deletion', {
                      count: idsToDelete.length,
                      ids: idsToDelete.slice(0, 10), // Log first 10 IDs
                    });
                    if (idsToDelete.length === 0) {
                      toast.error('No loads to delete');
                      setBulkDeleteOpen(false);
                      return;
                    }
                    bulkDeleteMutation.mutate(idsToDelete);
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={bulkDeleteMutation.isPending || getLoadIdsToDelete().length === 0}
                >
                  {bulkDeleteMutation.isPending ? 'Deleting...' : `Delete ${getSelectedCount()} Load(s)`}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Pagination */}
          {meta && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {meta.total > 0 ? ((page - 1) * pageSize) + 1 : 0} to{' '}
                {Math.min(page * pageSize, meta.total)} of {meta.total} loads
                {meta.totalPages > 1 && ` (Page ${page} of ${meta.totalPages})`}
              </div>
              {meta.totalPages > 1 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= meta.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {stats && <LoadStatsSummary stats={stats} filters={{ 
        ...advancedFilters, 
        status: statusFilter !== 'all' ? statusFilter : undefined, 
        search: searchQuery || undefined,
        // MC filtering handled server-side via cookies
        dispatcherId: dispatcherFilter !== 'all' ? dispatcherFilter : undefined,
      }} />}

      <ExportDialog 
        entityType="loads"
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
      />

      <LoadDetailDialog
        loadId={quickViewLoadId}
        open={!!quickViewLoadId}
        onOpenChange={(open) => {
          if (!open) setQuickViewLoadId(null);
        }}
      />
    </div>
  );
}

function LoadStatsSummary({ stats, filters }: { stats?: LoadStats; filters?: Record<string, any> }) {
  if (!stats) return null;

  // Fetch load stats (total loads, total revenue, active loads, avg revenue)
  const { data: loadStatsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['load-stats', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.set(key, value.toString());
        });
      }
      const response = await fetch(apiUrl(`/api/loads/stats?${params.toString()}`));
      if (!response.ok) throw new Error('Failed to fetch load stats');
      return response.json();
    },
  });

  const loadStats = loadStatsData?.data || {
    totalLoads: 0,
    totalRevenue: 0,
    activeLoads: 0,
    averageRevenue: 0,
  };

  const overviewItems: Array<{
    label: string;
    value: number | null;
    type: 'currency' | 'miles' | 'rpm' | 'number';
    note?: string;
  }> = [
    { label: 'Total Loads', value: isLoadingStats ? null : loadStats.totalLoads, type: 'number' },
    { label: 'Total Revenue', value: isLoadingStats ? null : loadStats.totalRevenue, type: 'currency' },
    { label: 'Active Loads', value: isLoadingStats ? null : loadStats.activeLoads, type: 'number' },
    { label: 'Avg Revenue', value: isLoadingStats ? null : loadStats.averageRevenue, type: 'currency' },
  ];

  const financialItems: Array<{
    label: string;
    value: number | null;
    type: 'currency' | 'miles' | 'rpm' | 'number';
    note?: string;
  }> = [
    { label: 'Total pay', value: stats.totalPay, type: 'currency' },
    { label: 'Total load pay', value: stats.totalLoadPay, type: 'currency' },
    { label: 'Driver gross', value: stats.driverGross, type: 'currency' },
    { label: 'Total miles', value: stats.totalMiles, type: 'miles' },
    { label: 'Loaded miles', value: stats.loadedMiles, type: 'miles' },
    { label: 'Empty miles', value: stats.emptyMiles, type: 'miles' },
    { label: 'RPM for loaded miles', value: stats.rpmLoadedMiles, type: 'rpm' },
    { label: 'RPM for total miles', value: stats.rpmTotalMiles, type: 'rpm' },
    {
      label: 'Service fee',
      value: stats.serviceFee,
      type: 'currency',
      note: 'Imported from Excel when available',
    },
  ];

  const formatStatValue = (value: number | null, type: 'currency' | 'miles' | 'rpm' | 'number') => {
    if (value === null || value === undefined) {
      return isLoadingStats ? '...' : '-';
    }

    if (type === 'currency') {
      return formatCurrency(value);
    }

    if (type === 'miles') {
      return typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-';
    }

    if (type === 'number') {
      return typeof value === 'number' ? value.toLocaleString() : '-';
    }

    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Totals</h3>
        <p className="text-sm text-muted-foreground">
          Calculated from the current filters and date range
        </p>
      </div>
      
      {/* Overview Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Overview</h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {overviewItems.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-sm text-muted-foreground mb-2">{item.label}</p>
              <p className="text-2xl font-bold">{formatStatValue(item.value, item.type)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Financial & Performance</h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {financialItems.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-sm text-muted-foreground mb-2">{item.label}</p>
              <p className="text-2xl font-bold">{formatStatValue(item.value, item.type)}</p>
              {item.note && (
                <p className="mt-2 text-xs text-muted-foreground">{item.note}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

