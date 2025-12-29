'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Download, Save, Columns } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import DriverTable from './DriverTable';
import { ShowDeletedToggle } from '@/components/common/ShowDeletedToggle';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { apiUrl } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ImportDialog from '@/components/import-export/ImportDialog';
import ExportDialog from '@/components/import-export/ExportDialog';
import BulkUpdatePayDialog from './BulkUpdatePayDialog';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import { driversTableConfig } from '@/lib/config/entities/drivers';
import AdvancedFilters from '@/components/filters/AdvancedFilters';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type DriverTab = 'active' | 'unassigned' | 'all' | 'terminated' | 'vacation';

interface Driver {
  id: string;
  driverNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  driverType: any;
  mcNumber: { id: string; number: string } | null;
  status: any;
  employeeStatus: any;
  assignmentStatus: any;
  dispatchStatus: any;
  truck?: { id: string; truckNumber: string } | null;
  trailer?: { id: string; trailerNumber: string } | null;
  currentTruckId?: string | null;
  currentTrailerId?: string | null;
  mcNumberId?: string | null;
  userId?: string;
  teamDriver: boolean;
  payTo: string | null;
  driverTariff: string | null;
  warnings: string | null;
  notes: string | null;
  hireDate: Date | null;
  terminationDate: Date | null;
  driverTags: string[];
  deletedAt?: Date | null; // For admin visibility
  isActive?: boolean;
}

async function fetchDrivers(params: {
  page?: number;
  limit?: number;
  tab?: DriverTab;
  search?: string;
  [key: string]: any;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.tab) queryParams.set('tab', params.tab);
  if (params.search) queryParams.set('search', params.search);

  Object.keys(params).forEach((key) => {
    if (!['page', 'limit', 'tab', 'search'].includes(key) && params[key]) {
      queryParams.set(key, params[key].toString());
    }
  });
  
  // Add includeDeleted if provided
  if (params.includeDeleted) {
    queryParams.set('includeDeleted', params.includeDeleted);
  }

  const response = await fetch(apiUrl(`/api/drivers?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch drivers');
  return response.json();
}

export default function DriverList() {
  const { can } = usePermissions();
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // Get includeDeleted from URL params (admins only)
  const includeDeleted = searchParams.get('includeDeleted') === 'true';
  
  const [activeTab, setActiveTab] = useState<DriverTab>('active');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(500);
  
  // Column visibility state - default to essential columns only
  const [visibleColumns, setVisibleColumns] = useState({
    checkbox: true,
    driverNumber: false, // Hidden by default
    name: true,
    email: true,
    phone: true,
    status: true,
    employeeStatus: true,
    assignmentStatus: true,
    dispatchStatus: false, // Hidden by default
    driverType: false, // Hidden by default
    mcNumber: true,
    teamDriver: false, // Hidden by default
    truck: true,
    trailer: false, // Hidden by default
    payTo: false, // Hidden by default
    driverTariff: false, // Hidden by default
    warnings: false, // Hidden by default
    tags: false, // Hidden by default
    actions: true,
  });

  // Load saved view settings from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('driverListView');
    if (savedView) {
      try {
        const viewSettings = JSON.parse(savedView);
        if (viewSettings.activeTab) setActiveTab(viewSettings.activeTab);
        if (viewSettings.visibleColumns) setVisibleColumns(viewSettings.visibleColumns);
        if (viewSettings.rowsPerPage) setRowsPerPage(viewSettings.rowsPerPage);
        if (viewSettings.searchQuery) setSearchQuery(viewSettings.searchQuery);
      } catch (e) {
        console.error('Failed to load saved view settings', e);
      }
    }
  }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['drivers', activeTab, page, rowsPerPage, searchQuery, includeDeleted],
    queryFn: () =>
      fetchDrivers({
        page,
        limit: rowsPerPage,
        tab: activeTab,
        search: searchQuery || undefined,
        ...(isAdmin && includeDeleted && { includeDeleted: 'true' }),
      }),
  });

  const drivers: Driver[] = data?.data || [];
  const meta = data?.meta;

  const handleSelectDriver = (driverId: string, checked: boolean) => {
    if (checked) {
      setSelectedDriverIds([...selectedDriverIds, driverId]);
    } else {
      setSelectedDriverIds(selectedDriverIds.filter((id) => id !== driverId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDriverIds(drivers.map((d) => d.id));
    } else {
      setSelectedDriverIds([]);
    }
  };

  const allSelected = drivers.length > 0 && selectedDriverIds.length === drivers.length;
  const someSelected = selectedDriverIds.length > 0 && selectedDriverIds.length < drivers.length;

  return (
    <div className="space-y-4">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as DriverTab);
          setPage(1);
          setSelectedDriverIds([]);
        }}>
          <TabsList>
            <TabsTrigger value="active">Active Drivers</TabsTrigger>
            <TabsTrigger value="unassigned">Unassigned drivers</TabsTrigger>
            <TabsTrigger value="all">All Drivers</TabsTrigger>
            <TabsTrigger value="terminated">Terminated Drivers</TabsTrigger>
            <TabsTrigger value="vacation">Vacation board</TabsTrigger>
          </TabsList>
        </Tabs>
        {can('drivers.create') && (
          <Link href="/dashboard/drivers/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create driver
            </Button>
          </Link>
        )}
      </div>

      {/* Secondary Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AdvancedFilters
            filters={[
              { field: 'licenseState', label: 'License State', type: 'text' },
              { field: 'homeTerminal', label: 'Home Terminal', type: 'text' },
              { field: 'mcNumberId', label: 'MC Number', type: 'text' },
            ]}
            onApply={(filters) => {
              // Filters are handled by the search/fetch function
              // This is a placeholder - you may want to add filter state management
              console.log('Applied filters:', filters);
            }}
            onClear={() => {
              console.log('Cleared filters');
            }}
          />
          {isAdmin && (
            <ShowDeletedToggle className="ml-2" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <ImportDialog 
            entityType="drivers" 
            onImportComplete={() => {
              // Invalidate and refetch drivers query
              queryClient.invalidateQueries({ queryKey: ['drivers'] });
              // Switch to 'all' tab to show all drivers (including newly imported ones)
              setActiveTab('all');
              setPage(1); // Reset to first page to show newly imported drivers
              // Refetch after a short delay to ensure state updates
              setTimeout(() => {
                refetch();
              }, 100);
            }}
          />
          <BulkUpdatePayDialog
            selectedDriverIds={selectedDriverIds.length > 0 ? selectedDriverIds : undefined}
            trigger={
              <Button variant="outline" size="sm">
                Update Pay
              </Button>
            }
          />
          <ExportDialog entityType="drivers" filename="drivers-export">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </ExportDialog>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Save current view settings to localStorage
              const viewSettings = {
                activeTab,
                visibleColumns,
                rowsPerPage,
                searchQuery,
              };
              localStorage.setItem('driverListView', JSON.stringify(viewSettings));
              toast.success('View settings saved');
            }}
          >
            <Save className="h-4 w-4 mr-2" />
            Save view
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
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
                checked={visibleColumns.driverNumber}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, driverNumber: checked })
                }
              >
                Driver Number
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.name}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, name: checked })
                }
              >
                Name
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.email}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, email: checked })
                }
              >
                Email
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.phone}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, phone: checked })
                }
              >
                Phone
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
                checked={visibleColumns.employeeStatus}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, employeeStatus: checked })
                }
              >
                Employee Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.assignmentStatus}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, assignmentStatus: checked })
                }
              >
                Assignment Status
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
                checked={visibleColumns.driverType}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, driverType: checked })
                }
              >
                Driver Type
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.mcNumber}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, mcNumber: checked })
                }
              >
                MC Number
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.teamDriver}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, teamDriver: checked })
                }
              >
                Team Driver
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
                checked={visibleColumns.payTo}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, payTo: checked })
                }
              >
                Pay To
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.driverTariff}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, driverTariff: checked })
                }
              >
                Driver Tariff
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.warnings}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, warnings: checked })
                }
              >
                Warnings
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.tags}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, tags: checked })
                }
              >
                Tags
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
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search other drivers..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading drivers...</div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          Error loading drivers. Please try again.
        </div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-lg font-medium mb-2">No drivers found</p>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Get started by adding your first driver'}
          </p>
          {!searchQuery && (
            <Link href="/dashboard/drivers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Driver
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <DriverTable
            drivers={drivers}
            selectedDriverIds={selectedDriverIds}
            onSelectDriver={handleSelectDriver}
            onSelectAll={handleSelectAll}
            allSelected={allSelected}
            someSelected={someSelected}
            canEdit={can('drivers.edit')}
            canDelete={can('drivers.delete')}
            visibleColumns={visibleColumns}
            onDriverUpdate={() => {
              refetch();
            }}
          />

          {/* Bulk Action Bar */}
          {selectedDriverIds.length > 0 && (
            <BulkActionBar
              selectedIds={selectedDriverIds}
              onClearSelection={() => setSelectedDriverIds([])}
              entityType="drivers"
              bulkEditFields={driversTableConfig.bulkEditFields}
              customBulkActions={driversTableConfig.customBulkActions}
              enableBulkEdit={can('drivers.bulk_edit') || can('data.bulk_edit')}
              enableBulkDelete={can('drivers.bulk_delete') || can('data.bulk_delete')}
              enableBulkExport={can('data.export') || can('export.execute')}
              onActionComplete={() => {
                setSelectedDriverIds([]);
                refetch();
              }}
            />
          )}

          {/* Pagination */}
          {meta && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * rowsPerPage) + 1} to{' '}
                {Math.min(page * rowsPerPage, meta.total)} of {meta.total} drivers
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select
                    value={rowsPerPage.toString()}
                    onValueChange={(value) => {
                      setRowsPerPage(parseInt(value));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="500">500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                  >
                    {'<<'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    {'<'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= meta.totalPages}
                  >
                    {'>'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(meta.totalPages)}
                    disabled={page >= meta.totalPages}
                  >
                    {'>>'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}



























