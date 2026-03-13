import { apiUrl } from '@/lib/utils';
import { format } from 'date-fns';

// ── Interfaces ──────────────────────────────────────────────

export interface LoadEntry {
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

export interface DriverSchedule {
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

export interface WeeklyData {
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

// ── Color Maps ──────────────────────────────────────────────

export const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-500/30 text-green-700 dark:text-green-300',
  ON_DUTY: 'bg-blue-500/30 text-blue-700 dark:text-blue-300',
  DRIVING: 'bg-purple-500/30 text-purple-700 dark:text-purple-300',
  OFF_DUTY: 'bg-gray-500/30 text-gray-700 dark:text-gray-300',
  ON_LEAVE: 'bg-amber-500/30 text-amber-700 dark:text-amber-300',
  INACTIVE: 'bg-red-500/30 text-red-700 dark:text-red-300',
};

export const LOAD_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/30 text-yellow-800 dark:text-yellow-200',
  ASSIGNED: 'bg-blue-500/30 text-blue-800 dark:text-blue-200',
  EN_ROUTE_PICKUP: 'bg-purple-500/30 text-purple-800 dark:text-purple-200',
  AT_PICKUP: 'bg-orange-500/30 text-orange-800 dark:text-orange-200',
  LOADED: 'bg-indigo-500/30 text-indigo-800 dark:text-indigo-200',
  EN_ROUTE_DELIVERY: 'bg-cyan-500/30 text-cyan-800 dark:text-cyan-200',
  AT_DELIVERY: 'bg-pink-500/30 text-pink-800 dark:text-pink-200',
  DELIVERED: 'bg-green-500/30 text-green-800 dark:text-green-200',
  INVOICED: 'bg-emerald-500/30 text-emerald-800 dark:text-emerald-200',
  PAID: 'bg-teal-500/30 text-teal-800 dark:text-teal-200',
};

// ── Data Fetching ───────────────────────────────────────────

export async function fetchWeeklySchedule(date: Date): Promise<WeeklyData> {
  const dateStr = format(date, 'yyyy-MM-dd');
  const response = await fetch(apiUrl(`/api/dispatch/weekly?date=${dateStr}`));
  if (!response.ok) throw new Error('Failed to fetch weekly schedule');
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch data');
  return result.data as WeeklyData;
}
