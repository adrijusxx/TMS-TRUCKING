'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Package, Plus, Search, Filter, Download, FileText, Edit, MapPin, Trash2, Upload, Settings2, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import ImportButton from '@/components/import-export/ImportButton';
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
import AdvancedFilters from '@/components/filters/AdvancedFilters';
import SavedFilters from '@/components/filters/SavedFilters';
import LoadListStats from '@/components/loads/LoadListStats';
import BulkStatusUpdate from '@/components/loads/BulkStatusUpdate';
import LoadQuickView from '@/components/loads/LoadQuickView';
import DocumentViewerDialog from '@/components/loads/DocumentViewerDialog';
import { useKeyboardShortcuts, commonShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/hooks/usePermissions';
import { Breadcrumb } from '@/components/ui/breadcrumb';

interface Load {
  id: string;
  loadNumber: string;
  status: LoadStatus;
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
  if (params.mc) queryParams.set('mc', params.mc);

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
  const view = searchParams?.get('view') || 'all';
  
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
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    checkbox: true,
    loadNumber: true,
    customer: true,
    route: true,
    stops: true,
    pickupDate: true,
    deliveryDate: true,
    driver: true,
    dispatcher: true,
    truck: true,
    trailer: true,
    status: true,
    revenue: true,
    driverPay: true,
    serviceFee: true,
    ratePerMile: true,
    miles: true,
    emptyMiles: true,
    documents: true,
    actions: true,
  });

  const mcParam = searchParams?.get('mc');
  const { data: dispatchersData } = useQuery({
    queryKey: ['dispatchers'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/settings/users?role=DISPATCHER'));
      if (!response.ok) throw new Error('Failed to fetch dispatchers');
      return response.json();
    },
  });
  const dispatchers = dispatchersData?.data || [];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['loads', page, pageSize, statusFilter, searchQuery, advancedFilters, view, mcParam, dispatcherFilter],
    queryFn: async () => {
      const mcParam = searchParams?.get('mc');
      const params: any = {
        page,
        limit: pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
        mc: mcParam || undefined,
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
      <Breadcrumb items={[{ label: 'Loads', href: '/dashboard/loads' }]} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Loads</h1>
          <p className="text-muted-foreground">
            Manage and track all your loads
          </p>
        </div>
        <div className="flex gap-2">
          <ImportButton entityType="loads" />
          <ExportDialog entityType="loads" />
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

      <LoadListStats filters={{ ...advancedFilters, status: statusFilter, search: searchQuery }} />

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
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.keys(statusColors).map((status) => (
              <SelectItem key={status} value={status}>
                {formatStatus(status as LoadStatus)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={dispatcherFilter}
          onValueChange={(value) => {
            setDispatcherFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Users className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by dispatcher" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dispatchers</SelectItem>
            {dispatchers.map((dispatcher: any) => (
              <SelectItem key={dispatcher.id} value={dispatcher.id}>
                {dispatcher.firstName} {dispatcher.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 flex-wrap">
          <AdvancedFilters
            filters={[
              { field: 'customerId', label: 'Customer', type: 'text' },
              { field: 'driverId', label: 'Driver', type: 'text' },
              { field: 'pickupCity', label: 'Pickup City', type: 'text' },
              { field: 'deliveryCity', label: 'Delivery City', type: 'text' },
              { field: 'pickupDate', label: 'Pickup Date', type: 'date' },
              { field: 'revenue', label: 'Min Revenue', type: 'number' },
            ]}
            onApply={(filters) => {
              setAdvancedFilters(filters);
              setPage(1);
            }}
            onClear={() => {
              setAdvancedFilters({});
              setPage(1);
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
          Error loading loads. Please try again.
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
                  {visibleColumns.checkbox && <TableHead className="w-32">
                    <div className="flex flex-col gap-1">
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
                      {!selectAllPages && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={handleSelectAllPages}
                          disabled={isFetchingAllIds}
                        >
                          {isFetchingAllIds ? 'Loading...' : 'Select All Pages'}
                        </Button>
                      )}
                      {selectAllPages && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={handleSelectAllPages}
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
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
                  {visibleColumns.revenue && <TableHead className="text-right">Revenue</TableHead>}
                  {visibleColumns.driverPay && <TableHead className="text-right">Driver Pay</TableHead>}
                  {visibleColumns.serviceFee && <TableHead className="text-right">Service Fee</TableHead>}
                  {visibleColumns.ratePerMile && <TableHead className="text-right">Rate/Mile</TableHead>}
                  {visibleColumns.miles && <TableHead className="text-right">Total Miles</TableHead>}
                  {visibleColumns.emptyMiles && <TableHead className="text-right">Empty Miles</TableHead>}
                  {visibleColumns.documents && <TableHead>Docs</TableHead>}
                  {visibleColumns.actions && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loads.map((load) => (
                  <TableRow key={load.id}>
                    {visibleColumns.checkbox && <TableCell>
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
                    {visibleColumns.loadNumber && <TableCell className="font-medium">
                      <button
                        onClick={() => setQuickViewLoadId(load.id)}
                        className="text-primary hover:underline text-left"
                      >
                        {load.loadNumber}
                      </button>
                    </TableCell>}
                    {visibleColumns.customer && <TableCell>
                      <div className="font-medium">{load.customer.name}</div>
                    </TableCell>}
                    {visibleColumns.route && <TableCell>
                      <div className="text-sm">
                        {(load.pickupCity && load.pickupCity !== 'Unknown' && load.deliveryCity && load.deliveryCity !== 'Unknown') ? (
                          <>
                            <div>
                              {load.pickupCity}, {load.pickupState || ''}
                            </div>
                            <div className="text-muted-foreground">→</div>
                            <div>
                              {load.deliveryCity}, {load.deliveryState || ''}
                            </div>
                          </>
                        ) : load.pickupLocation || load.deliveryLocation ? (
                          <>
                            <div>{load.pickupLocation || 'N/A'}</div>
                            <div className="text-muted-foreground">→</div>
                            <div>{load.deliveryLocation || 'N/A'}</div>
                          </>
                        ) : load.stops && load.stops.length > 0 ? (
                          <div className="text-muted-foreground">
                            {load.stops.filter((s: any) => s.stopType === 'PICKUP').length} pickup(s) →{' '}
                            {load.stops.filter((s: any) => s.stopType === 'DELIVERY').length} delivery(ies)
                          </div>
                        ) : (
                          <div className="text-muted-foreground">-</div>
                        )}
                      </div>
                    </TableCell>}
                    {visibleColumns.stops && <TableCell>
                      {load.stopsCount !== undefined && load.stopsCount !== null ? (
                        <div className="text-sm">
                          <span className="font-medium">{load.stopsCount}</span>
                          {load.stops && load.stops.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {load.stops.filter((s: any) => s.stopType === 'PICKUP').length} pickup /{' '}
                              {load.stops.filter((s: any) => s.stopType === 'DELIVERY').length} delivery
                            </div>
                          )}
                        </div>
                      ) : load.stops && load.stops.length > 0 ? (
                        <div className="text-sm">
                          <span className="font-medium">{load.stops.length}</span>
                          <div className="text-xs text-muted-foreground">
                            {load.stops.filter((s: any) => s.stopType === 'PICKUP').length} pickup /{' '}
                            {load.stops.filter((s: any) => s.stopType === 'DELIVERY').length} delivery
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">1</span>
                      )}
                    </TableCell>}
                    {visibleColumns.pickupDate && <TableCell>{formatDate(load.pickupDate)}</TableCell>}
                    {visibleColumns.deliveryDate && <TableCell>
                      {load.deliveryDate ? formatDate(load.deliveryDate) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.driver && <TableCell>
                      {load.driver ? (
                        <div>
                          {load.driver.user.firstName}{' '}
                          {load.driver.user.lastName}
                          <div className="text-sm text-muted-foreground">
                            {load.driver.driverNumber}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>}
                    {visibleColumns.dispatcher && <TableCell>
                      {load.dispatcher ? (
                        <div>
                          {load.dispatcher.firstName} {load.dispatcher.lastName}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.truck && <TableCell>
                      {load.truck ? (
                        load.truck.truckNumber
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.trailer && <TableCell>
                      {load.trailerNumber ? (
                        <span className="font-medium">{load.trailerNumber}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.status && <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[load.status as LoadStatus]}
                      >
                        {formatStatus(load.status)}
                      </Badge>
                    </TableCell>}
                    {visibleColumns.revenue && <TableCell className="text-right font-medium">
                      {formatCurrency(load.revenue)}
                    </TableCell>}
                    {visibleColumns.driverPay && <TableCell className="text-right text-sm">
                      {load.driverPay || load.totalPay ? (
                        <div>
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
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.serviceFee && <TableCell className="text-right text-sm">
                      {load.serviceFee ? (
                        <div className="font-medium">{formatCurrency(load.serviceFee)}</div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.ratePerMile && <TableCell className="text-right text-sm">
                      {load.totalMiles && load.totalMiles > 0 ? (
                        <div>
                          <div>${(load.revenue / load.totalMiles).toFixed(2)}</div>
                          {load.loadedMiles && load.loadedMiles > 0 && (
                            <div className="text-xs text-muted-foreground">
                              ${(load.revenue / load.loadedMiles).toFixed(2)} loaded
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.miles && <TableCell className="text-right">
                      {load.totalMiles ? (
                        <div className="font-medium">{load.totalMiles.toLocaleString()}</div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.emptyMiles && <TableCell className="text-right">
                      {load.emptyMiles ? (
                        <div className="font-medium">{load.emptyMiles.toLocaleString()}</div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.documents && <TableCell>
                      {load.documents && load.documents.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">{load.documents.length}</span>
                          <DocumentViewerDialog documents={load.documents} loadNumber={load.loadNumber} />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>}
                    {visibleColumns.actions && <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <LoadStatusQuickActions
                          loadId={load.id}
                          currentStatus={load.status}
                        />
                        {can('loads.edit') && (
                          <Link href={`/dashboard/loads/${load.id}/edit`}>
                            <Button variant="ghost" size="sm" title="Edit Load">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        <Link href={`/dashboard/loads/${load.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
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

      {stats && <LoadStatsSummary stats={stats} />}

      <LoadQuickView
        loadId={quickViewLoadId}
        open={!!quickViewLoadId}
        onOpenChange={(open) => {
          if (!open) setQuickViewLoadId(null);
        }}
      />
    </div>
  );
}

function LoadStatsSummary({ stats }: { stats?: LoadStats }) {
  if (!stats) return null;

  const summaryItems: Array<{
    label: string;
    value: number | null;
    type: 'currency' | 'miles' | 'rpm';
    note?: string;
  }> = [
    { label: 'Total pay', value: stats.totalPay, type: 'currency' },
    { label: 'Total load pay', value: stats.totalLoadPay, type: 'currency' },
    { label: 'Driver gross', value: stats.driverGross, type: 'currency' },
    { label: 'Total miles', value: stats.totalMiles, type: 'miles' },
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

  const formatStatValue = (value: number | null, type: 'currency' | 'miles' | 'rpm') => {
    if (value === null || value === undefined) {
      return '-';
    }

    if (type === 'currency') {
      return formatCurrency(value);
    }

    if (type === 'miles') {
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }

    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="mt-8 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Totals</h3>
        <p className="text-sm text-muted-foreground">
          Calculated from the current filters and date range
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border bg-card text-card-foreground p-4 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-bold">{formatStatValue(item.value, item.type)}</p>
            {item.note && (
              <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

