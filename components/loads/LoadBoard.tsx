'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import LoadBoardFilters, { type LoadBoardFilter } from './LoadBoardFilters';
import LoadBoardWeekTable from './LoadBoardWeekTable';
import LoadBoardStatsBar from './LoadBoardStatsBar';
import LoadBoardPagination from './LoadBoardPagination';
import { fetchWeeklySchedule } from './load-board-types';
import type { DriverSchedule } from './load-board-types';

const DispatchBoard = dynamic(() => import('@/components/dispatch/DispatchBoard'), {
  loading: () => <div className="flex items-center justify-center h-48"><Loader2 className="h-5 w-5 animate-spin" /></div>
});
const LoadCalendar = dynamic(() => import('@/components/calendar/LoadCalendar'), {
  loading: () => <div className="flex items-center justify-center h-48"><Loader2 className="h-5 w-5 animate-spin" /></div>
});

export default function LoadBoard() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [activeFilter, setActiveFilter] = React.useState<LoadBoardFilter>('ALL');
  const [activeTab, setActiveTab] = React.useState('drivers');
  const [pageSize, setPageSize] = React.useState(25);
  const [currentPage, setCurrentPage] = React.useState(1);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const queryKey = ['dispatch-weekly', format(currentDate, 'yyyy-MM-dd')];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => fetchWeeklySchedule(currentDate),
    refetchInterval: 300000,
    enabled: activeTab === 'drivers',
  });

  const handlePrevWeek = () => { setCurrentDate(subWeeks(currentDate, 1)); setCurrentPage(1); };
  const handleNextWeek = () => { setCurrentDate(addWeeks(currentDate, 1)); setCurrentPage(1); };
  const handleToday = () => { setCurrentDate(new Date()); setCurrentPage(1); };
  const handleRefresh = () => queryClient.invalidateQueries({ queryKey });

  const handleFilterChange = React.useCallback((filter: LoadBoardFilter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  }, []);

  const filteredDrivers = React.useMemo(() => {
    if (!data?.drivers) return [];
    if (activeFilter === 'ALL') return data.drivers;

    return data.drivers.filter((schedule: DriverSchedule) => {
      const status = schedule.driver.status;
      const hasLoads = Object.values(schedule.loadsByDate).some(loads => loads.length > 0);

      switch (activeFilter) {
        case 'HOME': return status === 'OFF_DUTY' || status === 'AVAILABLE';
        case 'OTR': return status === 'DRIVING' || status === 'ON_DUTY';
        case 'HOME_ALERTS': return status === 'AVAILABLE' && !hasLoads;
        case 'ONBOARD': return hasLoads;
        case 'IN_SHOP': return status === 'INACTIVE';
        case 'DROP': return status === 'ON_LEAVE';
        default: return true;
      }
    });
  }, [data?.drivers, activeFilter]);

  const filterCounts = React.useMemo(() => {
    if (!data?.drivers) return {} as Record<LoadBoardFilter, number>;

    const counts: Record<LoadBoardFilter, number> = {
      ALL: data.drivers.length, HOME: 0, OTR: 0, HOME_ALERTS: 0, ONBOARD: 0, IN_SHOP: 0, DROP: 0,
    };

    data.drivers.forEach((schedule: DriverSchedule) => {
      const status = schedule.driver.status;
      const hasLoads = Object.values(schedule.loadsByDate).some(loads => loads.length > 0);
      if (status === 'OFF_DUTY' || status === 'AVAILABLE') counts.HOME++;
      if (status === 'DRIVING' || status === 'ON_DUTY') counts.OTR++;
      if (status === 'AVAILABLE' && !hasLoads) counts.HOME_ALERTS++;
      if (hasLoads) counts.ONBOARD++;
      if (status === 'INACTIVE') counts.IN_SHOP++;
      if (status === 'ON_LEAVE') counts.DROP++;
    });

    return counts;
  }, [data?.drivers]);

  // Pagination
  const totalItems = filteredDrivers.length;
  const showAll = pageSize === 0;
  const totalPages = showAll ? 1 : Math.ceil(totalItems / pageSize);
  const paginatedDrivers = showAll
    ? filteredDrivers
    : filteredDrivers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const stats = data?.overallStats;

  return (
    <div className="space-y-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <TabsList className="h-7">
            <TabsTrigger value="drivers" className="text-xs h-6 px-2">Week View</TabsTrigger>
            <TabsTrigger value="dispatch" className="text-xs h-6 px-2">Dispatch</TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs h-6 px-2">Calendar</TabsTrigger>
          </TabsList>

          {activeTab === 'drivers' && stats && (
            <span className="text-xs text-muted-foreground">
              {stats.coveredDrivers}/{stats.totalDrivers} covered ({stats.coverageRatio}%)
            </span>
          )}

          {activeTab === 'drivers' && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={handlePrevWeek} className="h-6 w-6 p-0">
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday} className="h-6 text-xs px-2">
                Today
              </Button>
              <span className="text-xs font-medium px-1 min-w-[120px] text-center">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
              </span>
              <Button variant="outline" size="sm" onClick={handleNextWeek} className="h-6 w-6 p-0">
                <ChevronRight className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="h-6 w-6 p-0" title="Refresh">
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Link href="/dashboard/loads/new">
                <Button size="sm" className="h-6 text-xs px-2">
                  <Plus className="h-3 w-3 mr-1" />
                  New Load
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Week View Tab */}
        <TabsContent value="drivers" className="mt-2 space-y-2">
          <LoadBoardFilters
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            counts={filterCounts}
          />

          {stats && <LoadBoardStatsBar stats={stats} />}

          {isLoading && (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-xs text-muted-foreground">Loading...</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-48">
              <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-xs text-destructive">{error instanceof Error ? error.message : 'Error'}</p>
            </div>
          )}

          {!isLoading && !error && (
            <>
              <LoadBoardWeekTable drivers={paginatedDrivers} weekDays={weekDays} stats={stats} />
              <LoadBoardPagination
                pageSize={pageSize}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="dispatch" className="mt-2">
          <DispatchBoard />
        </TabsContent>

        <TabsContent value="calendar" className="mt-2">
          <LoadCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}
