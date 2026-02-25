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
  AVAILABLE: 'bg-green-500/20 text-green-400 dark:text-green-400',
  ON_DUTY: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
  DRIVING: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
  OFF_DUTY: 'bg-gray-500/20 text-gray-700 dark:text-gray-400',
  ON_LEAVE: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
  INACTIVE: 'bg-red-500/20 text-red-700 dark:text-red-400',
};

export const LOAD_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-300',
  ASSIGNED: 'bg-blue-500/20 text-blue-800 dark:text-blue-300',
  EN_ROUTE_PICKUP: 'bg-purple-500/20 text-purple-800 dark:text-purple-300',
  AT_PICKUP: 'bg-orange-500/20 text-orange-800 dark:text-orange-300',
  LOADED: 'bg-indigo-500/20 text-indigo-800 dark:text-indigo-300',
  EN_ROUTE_DELIVERY: 'bg-cyan-500/20 text-cyan-800 dark:text-cyan-300',
  AT_DELIVERY: 'bg-pink-500/20 text-pink-800 dark:text-pink-300',
  DELIVERED: 'bg-green-500/20 text-green-800 dark:text-green-300',
  INVOICED: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300',
  PAID: 'bg-teal-500/20 text-teal-800 dark:text-teal-300',
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
