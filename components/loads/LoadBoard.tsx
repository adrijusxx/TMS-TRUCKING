'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { cn, apiUrl, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Filter
} from 'lucide-react';
import LoadBoardFilters, { type LoadBoardFilter } from './LoadBoardFilters';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Lazy load the dispatch and calendar components
const DispatchBoard = dynamic(() => import('@/components/dispatch/DispatchBoard'), {
  loading: () => <div className="flex items-center justify-center h-48"><Loader2 className="h-5 w-5 animate-spin" /></div>
});
const LoadCalendar = dynamic(() => import('@/components/calendar/LoadCalendar'), {
  loading: () => <div className="flex items-center justify-center h-48"><Loader2 className="h-5 w-5 animate-spin" /></div>
});

interface DriverSchedule {
  driver: {
    id: string;
    driverNumber: string;
    firstName: string;
    lastName: string;
    status: string;
    currentTruck?: { id: string; truckNumber: string } | null;
    homeTerminal?: string | null;
  };
  loadsByDate: Record<string, LoadEntry[]>;
  summary: {
    trips: number;
    totalMiles: number;
    loadedMiles: number;
    emptyMiles: number;
    totalGross: number;
    totalDriverGross: number;
  };
}

interface LoadEntry {
  id: string;
  loadNumber: string;
  pickupCity?: string;
  pickupState?: string;
  deliveryCity?: string;
  deliveryState?: string;
  status: string;
  revenue: number;
  totalMiles: number;
}

interface WeeklyData {
  weekStart: string;
  weekEnd: string;
  weekDays: string[];
  drivers: DriverSchedule[];
  overallStats: {
    totalMiles: number;
    loadedMiles: number;
    emptyMiles: number;
    totalGross: number;
    totalDriverGross: number;
    coveredDrivers: number;
    totalDrivers: number;
    averageRate: string;
    coverageRatio: string;
  };
  statusCounts: Record<string, number>;
}

async function fetchWeeklySchedule(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const response = await fetch(apiUrl(`/api/dispatch/weekly?date=${dateStr}`));
  if (!response.ok) throw new Error('Failed to fetch weekly schedule');
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch data');
  return result.data as WeeklyData;
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-500/20 text-green-700',
  ON_DUTY: 'bg-blue-500/20 text-blue-700',
  DRIVING: 'bg-purple-500/20 text-purple-700',
  OFF_DUTY: 'bg-gray-500/20 text-gray-700',
  ON_LEAVE: 'bg-amber-500/20 text-amber-700',
  INACTIVE: 'bg-red-500/20 text-red-700',
};

const LOAD_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  EN_ROUTE_PICKUP: 'bg-purple-100 text-purple-800',
  AT_PICKUP: 'bg-orange-100 text-orange-800',
  LOADED: 'bg-indigo-100 text-indigo-800',
  EN_ROUTE_DELIVERY: 'bg-cyan-100 text-cyan-800',
  AT_DELIVERY: 'bg-pink-100 text-pink-800',
  DELIVERED: 'bg-green-100 text-green-800',
  INVOICED: 'bg-emerald-100 text-emerald-800',
  PAID: 'bg-teal-100 text-teal-800',
};

export default function LoadBoard() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [activeFilter, setActiveFilter] = React.useState<LoadBoardFilter>('ALL');
  const [activeTab, setActiveTab] = React.useState('drivers');

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data, isLoading, error } = useQuery({
    queryKey: ['dispatch-weekly', format(currentDate, 'yyyy-MM-dd')],
    queryFn: () => fetchWeeklySchedule(currentDate),
    refetchInterval: 300000, // 5 minutes
    enabled: activeTab === 'drivers',
  });

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const filteredDrivers = React.useMemo(() => {
    if (!data?.drivers) return [];
    if (activeFilter === 'ALL') return data.drivers;

    return data.drivers.filter((schedule) => {
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

    data.drivers.forEach((schedule) => {
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

  const stats = data?.overallStats;

  return (
    <div className="space-y-2">
      {/* Main View Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <TabsList className="h-7">
            <TabsTrigger value="drivers" className="text-xs h-6 px-2">Week View</TabsTrigger>
            <TabsTrigger value="dispatch" className="text-xs h-6 px-2">Dispatch</TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs h-6 px-2">Calendar</TabsTrigger>
          </TabsList>

          {/* Week Navigation - only for drivers tab */}
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
            </div>
          )}

          {activeTab === 'drivers' && (
            <Button variant="outline" size="sm" className="h-6 text-xs px-2">
              <Filter className="h-3 w-3 mr-1" />
              Filters
            </Button>
          )}
        </div>

        {/* Drivers Week View Tab */}
        <TabsContent value="drivers" className="mt-2 space-y-2">
          {/* Status Filter Pills */}
          <LoadBoardFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={filterCounts}
          />

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-xs text-muted-foreground">Loading...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center h-48">
              <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-xs text-destructive">{error instanceof Error ? error.message : 'Error'}</p>
            </div>
          )}

          {/* Data Table */}
          {!isLoading && !error && (
            <div className="border rounded overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left py-1 px-2 font-medium sticky left-0 bg-muted/50 z-10 min-w-[100px]">Driver</th>
                      <th className="text-left py-1 px-1 font-medium min-w-[60px]">Status</th>
                      <th className="text-left py-1 px-1 font-medium min-w-[50px]">Truck</th>
                      <th className="text-right py-1 px-1 font-medium min-w-[55px]">Gross</th>
                      <th className="text-right py-1 px-1 font-medium min-w-[45px]">Miles</th>
                      <th className="text-right py-1 px-1 font-medium min-w-[40px]">RPM</th>
                      {weekDays.map((day) => (
                        <th
                          key={format(day, 'yyyy-MM-dd')}
                          className={cn(
                            'text-center py-1 px-1 font-medium min-w-[70px]',
                            format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && 'bg-primary/10'
                          )}
                        >
                          <div className="text-[9px] text-muted-foreground">{format(day, 'EEE')}</div>
                          <div>{format(day, 'd')}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrivers.map((schedule) => {
                      const rpm = schedule.summary.totalMiles > 0
                        ? schedule.summary.totalGross / schedule.summary.totalMiles : 0;

                      return (
                        <tr key={schedule.driver.id} className="border-b hover:bg-muted/30">
                          <td className="py-1 px-2 sticky left-0 bg-background z-10">
                            <Link href={`/dashboard/drivers/${schedule.driver.id}`} className="hover:underline font-medium">
                              {schedule.driver.firstName} {schedule.driver.lastName}
                            </Link>
                          </td>
                          <td className="py-1 px-1">
                            <Badge variant="secondary" className={cn('text-[9px] h-4 px-1', STATUS_COLORS[schedule.driver.status] || 'bg-gray-100')}>
                              {schedule.driver.status?.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="py-1 px-1 text-muted-foreground">
                            {schedule.driver.currentTruck?.truckNumber || '-'}
                          </td>
                          <td className="py-1 px-1 text-right font-medium">
                            {formatCurrency(schedule.summary.totalGross)}
                          </td>
                          <td className="py-1 px-1 text-right text-muted-foreground">
                            {schedule.summary.totalMiles.toLocaleString()}
                          </td>
                          <td className={cn(
                            'py-1 px-1 text-right font-medium',
                            rpm >= 3 ? 'text-green-600' : rpm >= 2 ? 'text-amber-600' : 'text-red-600'
                          )}>
                            ${rpm.toFixed(2)}
                          </td>
                          {weekDays.map((day) => {
                            const dayKey = format(day, 'yyyy-MM-dd');
                            const loads = schedule.loadsByDate[dayKey] || [];
                            const isToday = dayKey === format(new Date(), 'yyyy-MM-dd');

                            return (
                              <td key={dayKey} className={cn('py-1 px-1 text-center', isToday && 'bg-primary/5')}>
                                {loads.length > 0 ? (
                                  <div className="flex flex-col gap-0.5">
                                    {loads.slice(0, 2).map((load) => (
                                      <Link
                                        key={load.id}
                                        href={`/dashboard/loads/${load.id}`}
                                        className={cn(
                                          'block text-[8px] px-0.5 py-0.5 rounded truncate hover:opacity-80',
                                          LOAD_STATUS_COLORS[load.status] || 'bg-gray-100'
                                        )}
                                        title={`${load.loadNumber}: ${load.pickupState || ''} → ${load.deliveryState || ''}`}
                                      >
                                        {load.pickupState || '?'}→{load.deliveryState || '?'}
                                      </Link>
                                    ))}
                                    {loads.length > 2 && (
                                      <span className="text-[8px] text-muted-foreground">+{loads.length - 2}</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/30">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    {filteredDrivers.length === 0 && (
                      <tr>
                        <td colSpan={13} className="py-6 text-center text-muted-foreground text-xs">
                          No drivers found
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {stats && filteredDrivers.length > 0 && (
                    <tfoot>
                      <tr className="bg-muted/50 border-t font-medium">
                        <td className="py-1 px-2 sticky left-0 bg-muted/50 z-10">
                          Total ({filteredDrivers.length})
                        </td>
                        <td className="py-1 px-1" />
                        <td className="py-1 px-1" />
                        <td className="py-1 px-1 text-right">{formatCurrency(stats.totalGross)}</td>
                        <td className="py-1 px-1 text-right">{stats.totalMiles.toLocaleString()}</td>
                        <td className="py-1 px-1 text-right">${stats.averageRate}</td>
                        {weekDays.map((day) => <td key={format(day, 'yyyy-MM-dd')} className="py-1 px-1" />)}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Dispatch Board Tab */}
        <TabsContent value="dispatch" className="mt-2">
          <DispatchBoard />
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="mt-2">
          <LoadCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}
