'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Container, UserX, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import SortableColumnHeader from './SortableColumnHeader';
import InventoryTableToolbar from './InventoryTableToolbar';
import MarkOOSDialog from './MarkOOSDialog';
import { TruckRow, TrailerRow, IdleDriverRow, DormantEquipmentRow } from './FleetInventoryRows';
import type {
  TruckInventoryItem, TrailerInventoryItem,
  InventoryResponse, OOSEquipmentRef,
  IdleDriver, DormantEquipment,
} from '@/lib/managers/fleet-monitoring/types';

type TabType = 'truck' | 'trailer' | 'idle-drivers' | 'dormant-equipment';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'IN_USE', label: 'In Use' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
  { value: 'NEEDS_REPAIR', label: 'Needs Repair' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'DORMANT', label: 'Dormant' },
];

const TAB_ICONS: Record<TabType, React.ComponentType<{ className?: string }>> = {
  truck: Truck, trailer: Container, 'idle-drivers': UserX, 'dormant-equipment': AlertTriangle,
};

const ITEMS_PER_PAGE = 10;

interface Props {
  idleDrivers?: IdleDriver[];
  dormantTrucks?: DormantEquipment[];
  dormantTrailers?: DormantEquipment[];
  monitoringLoading?: boolean;
  onMarkOOS?: () => void;
}

export default function FleetInventoryTable({
  idleDrivers = [], dormantTrucks = [], dormantTrailers = [], monitoringLoading, onMarkOOS,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('truck');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ column: string; order: 'asc' | 'desc' }>({ column: 'truckNumber', order: 'asc' });
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [oosTarget, setOosTarget] = useState<OOSEquipmentRef | null>(null);

  const isInventoryTab = activeTab === 'truck' || activeTab === 'trailer';

  // Server-side query for truck/trailer inventory tabs
  const { data, isLoading: inventoryLoading, refetch } = useQuery<{ success: boolean; data: InventoryResponse<any> }>({
    queryKey: ['fleet-inventory', activeTab, page, sort, status, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: activeTab, page: String(page), limit: '20',
        sortBy: sort.column, sortOrder: sort.order,
      });
      if (status !== 'ALL') params.set('status', status);
      if (search) params.set('search', search);
      const res = await fetch(`/api/fleet/monitoring/inventory?${params}`);
      return res.json();
    },
    enabled: isInventoryTab,
  });

  // Client-side filtering/sorting/pagination for idle drivers
  const filteredIdleDrivers = useMemo(() => {
    let list = [...idleDrivers];
    if (search) {
      const term = search.toLowerCase();
      list = list.filter(d => d.driverName.toLowerCase().includes(term) || d.driverNumber.toLowerCase().includes(term));
    }
    if (sort.column === 'idleHours') {
      list.sort((a, b) => sort.order === 'asc' ? a.idleHours - b.idleHours : b.idleHours - a.idleHours);
    } else {
      list.sort((a, b) => sort.order === 'asc'
        ? a.driverName.localeCompare(b.driverName)
        : b.driverName.localeCompare(a.driverName));
    }
    return list;
  }, [idleDrivers, search, sort]);

  // Client-side filtering/sorting/pagination for dormant equipment
  const dormantCombined = useMemo(() => [...dormantTrucks, ...dormantTrailers], [dormantTrucks, dormantTrailers]);
  const filteredDormant = useMemo(() => {
    let list = [...dormantCombined];
    if (search) {
      const term = search.toLowerCase();
      list = list.filter(e => e.number.toLowerCase().includes(term));
    }
    if (sort.column === 'daysSinceLastLoad') {
      list.sort((a, b) => sort.order === 'asc' ? a.daysSinceLastLoad - b.daysSinceLastLoad : b.daysSinceLastLoad - a.daysSinceLastLoad);
    } else {
      list.sort((a, b) => sort.order === 'asc' ? a.number.localeCompare(b.number) : b.number.localeCompare(a.number));
    }
    return list;
  }, [dormantCombined, search, sort]);

  // Compute items/meta based on active tab
  const clientList = activeTab === 'idle-drivers' ? filteredIdleDrivers : filteredDormant;
  const clientTotalPages = Math.ceil(clientList.length / ITEMS_PER_PAGE);
  const clientPaged = clientList.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const inventoryItems = data?.data?.items ?? [];
  const inventoryMeta = data?.data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 0 };

  const totalCount = isInventoryTab ? inventoryMeta.total : clientList.length;
  const currentTotalPages = isInventoryTab ? inventoryMeta.totalPages : clientTotalPages;
  const isLoading = isInventoryTab ? inventoryLoading : !!monitoringLoading;

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as TabType);
    setPage(1);
    setSearch('');
    setStatus('ALL');
    if (tab === 'truck') setSort({ column: 'truckNumber', order: 'asc' });
    else if (tab === 'trailer') setSort({ column: 'trailerNumber', order: 'asc' });
    else if (tab === 'idle-drivers') setSort({ column: 'idleHours', order: 'desc' });
    else setSort({ column: 'daysSinceLastLoad', order: 'desc' });
  }, []);

  const handleSort = useCallback((col: string) => {
    setSort(prev => prev.column === col
      ? { column: col, order: prev.order === 'asc' ? 'desc' : 'asc' }
      : { column: col, order: 'asc' });
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((s: string) => { setStatus(s); setPage(1); }, []);
  const handleSearchChange = useCallback((s: string) => { setSearch(s); setPage(1); }, []);

  const Icon = TAB_ICONS[activeTab];

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Icon className="h-4 w-4" /> Fleet Monitoring
            </CardTitle>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="h-8">
                <TabsTrigger value="truck" className="text-xs px-2.5 py-1 gap-1">
                  <Truck className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Trucks</span>
                </TabsTrigger>
                <TabsTrigger value="trailer" className="text-xs px-2.5 py-1 gap-1">
                  <Container className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Trailers</span>
                </TabsTrigger>
                <TabsTrigger value="idle-drivers" className="text-xs px-2.5 py-1 gap-1">
                  <UserX className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Idle Drivers</span>
                </TabsTrigger>
                <TabsTrigger value="dormant-equipment" className="text-xs px-2.5 py-1 gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Dormant</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <InventoryTableToolbar
            statusOptions={isInventoryTab ? STATUS_OPTIONS : undefined}
            selectedStatus={isInventoryTab ? status : undefined}
            onStatusChange={isInventoryTab ? handleStatusChange : undefined}
            searchValue={search}
            searchPlaceholder={activeTab === 'idle-drivers' ? 'Search driver...' : 'Search unit #...'}
            onSearchChange={handleSearchChange}
            totalCount={totalCount}
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse bg-muted rounded" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      {activeTab === 'truck' && <TruckHeaders sort={sort} onSort={handleSort} />}
                      {activeTab === 'trailer' && <TrailerHeaders sort={sort} onSort={handleSort} />}
                      {activeTab === 'idle-drivers' && <IdleDriverHeaders sort={sort} onSort={handleSort} />}
                      {activeTab === 'dormant-equipment' && <DormantHeaders sort={sort} onSort={handleSort} />}
                    </tr>
                  </thead>
                  <tbody>
                    {activeTab === 'truck' && inventoryItems.map((item: TruckInventoryItem) => (
                      <TruckRow key={item.id} truck={item} onMarkOOS={setOosTarget} />
                    ))}
                    {activeTab === 'trailer' && inventoryItems.map((item: TrailerInventoryItem) => (
                      <TrailerRow key={item.id} trailer={item} onMarkOOS={setOosTarget} />
                    ))}
                    {activeTab === 'idle-drivers' && (clientPaged as IdleDriver[]).map((d) => (
                      <IdleDriverRow key={d.driverId} driver={d} onRefresh={onMarkOOS} />
                    ))}
                    {activeTab === 'dormant-equipment' && (clientPaged as DormantEquipment[]).map((eq) => (
                      <DormantEquipmentRow key={eq.id} eq={eq} onMarkOOS={setOosTarget} />
                    ))}
                  </tbody>
                </table>
                {totalCount === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {activeTab === 'idle-drivers' ? 'All drivers have active loads assigned.'
                      : activeTab === 'dormant-equipment' ? 'No dormant equipment detected.'
                      : `No ${activeTab === 'truck' ? 'trucks' : 'trailers'} found.`}
                  </p>
                )}
              </div>
              {currentTotalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t mt-2">
                  <p className="text-xs text-muted-foreground">
                    Page {page} of {currentTotalPages}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= currentTotalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {oosTarget && (
        <MarkOOSDialog
          equipment={oosTarget}
          open={!!oosTarget}
          onOpenChange={(open) => !open && setOosTarget(null)}
          onSuccess={() => { setOosTarget(null); refetch(); onMarkOOS?.(); }}
        />
      )}
    </>
  );
}

/* ─── Column Headers per tab ─── */

function TruckHeaders({ sort, onSort }: { sort: { column: string; order: 'asc' | 'desc' }; onSort: (col: string) => void }) {
  return (
    <>
      <SortableColumnHeader label="Unit #" column="truckNumber" currentSort={sort} onSort={onSort} />
      <th className="pb-2 pr-3 font-medium">Vehicle</th>
      <SortableColumnHeader label="Status" column="status" currentSort={sort} onSort={onSort} />
      <th className="pb-2 pr-3 font-medium">Driver</th>
      <th className="pb-2 pr-3 font-medium">Active Load</th>
      <th className="pb-2 pr-3 font-medium">Last Load</th>
      <SortableColumnHeader label="Days Idle" column="daysSinceLastLoad" currentSort={sort} onSort={onSort} />
      <th className="pb-2 pr-3 font-medium">Location</th>
      <th className="pb-2 pr-3 font-medium">OOS</th>
      <th className="pb-2 font-medium"></th>
    </>
  );
}

function TrailerHeaders({ sort, onSort }: { sort: { column: string; order: 'asc' | 'desc' }; onSort: (col: string) => void }) {
  return (
    <>
      <SortableColumnHeader label="Unit #" column="trailerNumber" currentSort={sort} onSort={onSort} />
      <SortableColumnHeader label="Type" column="type" currentSort={sort} onSort={onSort} />
      <th className="pb-2 pr-3 font-medium">Vehicle</th>
      <SortableColumnHeader label="Status" column="status" currentSort={sort} onSort={onSort} />
      <th className="pb-2 pr-3 font-medium">Assigned Truck</th>
      <th className="pb-2 pr-3 font-medium">Active Load</th>
      <th className="pb-2 pr-3 font-medium">Last Load</th>
      <SortableColumnHeader label="Days Idle" column="daysSinceLastLoad" currentSort={sort} onSort={onSort} />
      <th className="pb-2 pr-3 font-medium">Location</th>
      <th className="pb-2 pr-3 font-medium">OOS</th>
      <th className="pb-2 font-medium"></th>
    </>
  );
}

function IdleDriverHeaders({ sort, onSort }: { sort: { column: string; order: 'asc' | 'desc' }; onSort: (col: string) => void }) {
  return (
    <>
      <SortableColumnHeader label="Driver" column="driverName" currentSort={sort} onSort={onSort} />
      <th className="pb-2 pr-3 font-medium">Home Terminal</th>
      <th className="pb-2 pr-3 font-medium">Last Load</th>
      <SortableColumnHeader label="Idle Time" column="idleHours" currentSort={sort} onSort={onSort} />
      <th className="pb-2 pr-3 font-medium">Location</th>
      <th className="pb-2 font-medium"></th>
    </>
  );
}

function DormantHeaders({ sort, onSort }: { sort: { column: string; order: 'asc' | 'desc' }; onSort: (col: string) => void }) {
  return (
    <>
      <SortableColumnHeader label="Unit" column="number" currentSort={sort} onSort={onSort} />
      <th className="pb-2 pr-3 font-medium">Type</th>
      <th className="pb-2 pr-3 font-medium">Last Load</th>
      <SortableColumnHeader label="Dormant" column="daysSinceLastLoad" currentSort={sort} onSort={onSort} />
      <th className="pb-2 pr-3 font-medium">GPS</th>
      <th className="pb-2 font-medium">Actions</th>
    </>
  );
}
