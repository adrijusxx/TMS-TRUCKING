'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, apiUrl } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  User,
  MapPin,
  RefreshCw,
  Save,
  Settings,
  Plus,
  Home,
  List,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

async function fetchWeeklySchedule(date: string) {
  const response = await fetch(apiUrl(`/api/dispatch/weekly?date=${date}`));
  if (!response.ok) throw new Error('Failed to fetch weekly schedule');
  return response.json();
}

interface LoadBlock {
  id: string;
  loadNumber: string;
  pickupCity: string | null;
  pickupState: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  revenue: number;
  driverPay: number;
  serviceFee: number;
  loadedMiles: number;
  emptyMiles: number;
  totalMiles: number;
  status: string;
  customerName: string;
  dispatchNotes: string | null;
}

interface DriverSchedule {
  driver: {
    id: string;
    driverNumber: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    status: string;
    companyName: string;
    currentTruck: { id: string; truckNumber: string } | null;
    homeTerminal: string | null;
  };
  loadsByDate: Record<string, LoadBlock[]>;
  summary: {
    trips: number;
    totalMiles: number;
    loadedMiles: number;
    emptyMiles: number;
    rate: number;
    totalDriverGross: number;
    totalGross: number;
    serviceFees: number;
  };
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-500 text-white',
  ON_DUTY: 'bg-blue-500 text-white',
  DRIVING: 'bg-orange-500 text-white',
  OFF_DUTY: 'bg-gray-500 text-white',
  SLEEPER_BERTH: 'bg-purple-500 text-white',
  ON_LEAVE: 'bg-yellow-500 text-white',
  INACTIVE: 'bg-red-500 text-white',
  DISPATCHED: 'bg-blue-500 text-white',
  IN_TRANSIT: 'bg-orange-500 text-white',
  HOME: 'bg-gray-500 text-white',
  SHOP: 'bg-red-500 text-white',
  REST: 'bg-purple-500 text-white',
};

function formatStatus(status: string | null | undefined): string {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ');
}

export default function WeeklyScheduleView() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [groupByDispatcher, setGroupByDispatcher] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });

  const { data, isLoading, error } = useQuery({
    queryKey: ['weekly-schedule', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => fetchWeeklySchedule(format(selectedDate, 'yyyy-MM-dd')),
  });

  const scheduleData = data?.data;
  const weekDays = scheduleData?.weekDays || [];
  let drivers = scheduleData?.drivers || [];

  // Apply status filter
  if (statusFilter) {
    drivers = drivers.filter(
      (d: DriverSchedule) => d.driver.status === statusFilter
    );
  }

  // Pagination
  const totalPages = Math.ceil(drivers.length / pageSize);
  const paginatedDrivers = drivers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePreviousWeek = () => {
    setSelectedDate(subWeeks(selectedDate, 1));
    setCurrentPage(1);
  };

  const handleNextWeek = () => {
    setSelectedDate(addWeeks(selectedDate, 1));
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ['weekly-schedule', format(selectedDate, 'yyyy-MM-dd')],
    });
    toast.success('Schedule refreshed');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading weekly schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Error loading weekly schedule. Please try again.
      </div>
    );
  }

  const overallStats = scheduleData?.overallStats || {};
  const statusCounts = scheduleData?.statusCounts || {};

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 p-4 bg-card border rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {format(weekStart, 'MMM d, yyyy')} - {format(weekEnd, 'MMM d, yyyy')}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date())}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Covered drivers: {overallStats.coveredDrivers} out of{' '}
              {overallStats.totalDrivers}
            </div>
            <div className="text-sm text-muted-foreground">
              Coverage ratio: {overallStats.coverageRatio}%
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Home request
            </Button>
            <Button variant="outline" size="sm">
              <List className="h-4 w-4 mr-2" />
              Capacity list
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Load
            </Button>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="groupByDispatcher"
                checked={groupByDispatcher}
                onChange={(e) => setGroupByDispatcher(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="groupByDispatcher" className="text-sm">
                Group by dispatcher
              </label>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Save className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-muted">
              <tr>
                <th className="border p-2 text-left min-w-[200px] sticky left-0 bg-muted z-10">
                  Driver
                </th>
                <th className="border p-2 text-left min-w-[150px]">Dispatch Notes</th>
                {weekDays.map((day: string) => (
                  <th
                    key={day}
                    className="border p-2 text-center min-w-[150px]"
                  >
                    <div className="font-medium">
                      {format(new Date(day), 'MMM d')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(day), 'EEE').toUpperCase()}
                    </div>
                  </th>
                ))}
                <th className="border p-2 text-left min-w-[200px]">Summary</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDrivers.map((schedule: DriverSchedule) => (
                <tr key={schedule.driver.id} className="hover:bg-muted/50">
                  {/* Driver Info Column */}
                  <td className="border p-2 sticky left-0 bg-background z-10">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">
                        {schedule.driver.companyName}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {schedule.driver.firstName} {schedule.driver.lastName}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {schedule.driver.driverNumber}
                      </div>
                      {schedule.driver.currentTruck && (
                        <div className="text-xs text-muted-foreground">
                          Truck: {schedule.driver.currentTruck.truckNumber}
                        </div>
                      )}
                      {schedule.driver.homeTerminal && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {schedule.driver.homeTerminal}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge
                          className={cn(
                            'text-xs',
                            statusColors[schedule.driver.status] ||
                              'bg-gray-500 text-white'
                          )}
                        >
                          {formatStatus(schedule.driver.status)}
                        </Badge>
                      </div>
                      {schedule.driver.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 mt-1"
                          onClick={() => {
                            window.location.href = `tel:${schedule.driver.phone}`;
                          }}
                        >
                          <Phone className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </td>

                  {/* Dispatch Notes Column */}
                  <td className="border p-2">
                    <div className="text-xs">
                      {schedule.loadsByDate &&
                      Object.values(schedule.loadsByDate).some(
                        (loads: any) =>
                          loads.length > 0 &&
                          loads.some((l: LoadBlock) => l.dispatchNotes)
                      )
                        ? (() => {
                            const allNotes = Object.values(schedule.loadsByDate)
                              .flat()
                              .map((l: LoadBlock) => l.dispatchNotes)
                              .filter(Boolean);
                            // Try to extract dispatcher name from notes (common patterns)
                            const dispatcherMatch = allNotes[0]?.match(
                              /(?:dispatcher|dispatch|by):\s*([^,\n]+)/i
                            );
                            return dispatcherMatch
                              ? dispatcherMatch[1].trim()
                              : allNotes[0] || '-';
                          })()
                        : '-'}
                    </div>
                  </td>

                  {/* Day Columns */}
                  {weekDays.map((day: string) => {
                    const loads = schedule.loadsByDate[day] || [];
                    return (
                      <td key={day} className="border p-1 align-top">
                        <div className="space-y-1 min-h-[60px]">
                          {loads.map((load: LoadBlock) => (
                            <div
                              key={load.id}
                              className={cn(
                                'p-2 rounded text-xs cursor-pointer hover:opacity-80',
                                load.status === 'DELIVERED' ||
                                  load.status === 'COMPLETED'
                                  ? 'bg-green-100 border border-green-300 dark:bg-green-900/30 dark:border-green-800'
                                  : 'bg-blue-100 border border-blue-300 dark:bg-blue-900/30 dark:border-blue-800'
                              )}
                              title={`${load.customerName} - ${load.pickupCity}, ${load.pickupState} → ${load.deliveryCity}, ${load.deliveryState}`}
                            >
                              <div className="font-medium">
                                {load.pickupState} → {load.deliveryState}
                              </div>
                              <div className="text-muted-foreground">
                                {load.loadNumber}
                              </div>
                              <div className="font-semibold text-green-700">
                                {formatCurrency(load.revenue)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}

                  {/* Summary Column */}
                  <td className="border p-2">
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">Trips: </span>
                        <span className="font-medium">{schedule.summary.trips}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total mile: </span>
                        <span className="font-medium">
                          {schedule.summary.totalMiles.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rate: </span>
                        <span className="font-medium">
                          ${schedule.summary.rate.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Driver Gross: </span>
                        <span className="font-medium">
                          {formatCurrency(schedule.summary.totalDriverGross)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total gross: </span>
                        <span className="font-medium">
                          {formatCurrency(schedule.summary.totalGross)}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-4 p-4 bg-card border rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Total Mile: </span>
              <span className="font-medium">
                {overallStats.totalMiles?.toLocaleString() || 0} mi
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Empty Mile: </span>
              <span className="font-medium">
                {overallStats.emptyMiles?.toLocaleString() || 0} mi
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Gross: </span>
              <span className="font-medium">
                {formatCurrency(overallStats.totalGross || 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Driver Gross: </span>
              <span className="font-medium">
                {formatCurrency(overallStats.totalDriverGross || 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Service Fees: </span>
              <span className="font-medium">
                {formatCurrency(overallStats.serviceFees || 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Rate: </span>
              <span className="font-medium">
                ${overallStats.averageRate || '0.00'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            {Object.entries(statusCounts).map(([status, count]) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setStatusFilter(statusFilter === status ? null : status)
                }
                className={cn(
                  statusFilter === status &&
                    (statusColors[status] || 'bg-gray-500 text-white')
                )}
              >
                {formatStatus(status)} {count as number}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Page size:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                {currentPage} {totalPages > 1 && `of ${totalPages}`}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

