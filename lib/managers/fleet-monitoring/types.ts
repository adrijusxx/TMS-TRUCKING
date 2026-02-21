import type { DriverStatus, TruckStatus, TrailerStatus } from '@prisma/client';

export interface IdleDriver {
  driverId: string;
  driverNumber: string;
  driverName: string;
  homeTerminal: string | null;
  lastDeliveredAt: Date | null;
  lastLoadNumber: string | null;
  nextAssignedAt: Date | null;
  nextLoadNumber: string | null;
  idleHours: number;
  isAtHomeTerminal: boolean | null;
  currentLocation: string | null;
  status: DriverStatus;
}

export interface DormantEquipment {
  id: string;
  number: string;
  type: 'TRUCK' | 'TRAILER';
  status: TruckStatus | TrailerStatus;
  lastActiveLoadDate: Date | null;
  lastActiveLoadNumber: string | null;
  daysSinceLastLoad: number;
  hasSamsaraMovement: boolean | null;
  lastSamsaraTrip: Date | null;
  isLongTermOOS: boolean;
  outOfServiceReason: string | null;
  expectedReturnDate: Date | null;
}

export interface FleetMonitoringSnapshot {
  idleDrivers: IdleDriver[];
  dormantTrucks: DormantEquipment[];
  dormantTrailers: DormantEquipment[];
  excludedOOS: {
    trucks: number;
    trailers: number;
  };
  summary: {
    totalIdleDrivers: number;
    totalDormantTrucks: number;
    totalDormantTrailers: number;
    averageIdleHours: number;
  };
  generatedAt: Date;
}

export interface FleetUtilizationPeriod {
  period: string;
  truckUtilizationRate: number;
  trailerUtilizationRate: number;
  driverUtilizationRate: number;
  activeTrucks: number;
  totalTrucks: number;
  activeTrailers: number;
  totalTrailers: number;
  busyDrivers: number;
  totalDrivers: number;
  averageDriverIdleHours: number;
}

export interface FleetMonitoringSettings {
  dormantTruckDays: number;
  dormantTrailerDays: number;
  driverIdleAlertHours: number;
  enableAlerts: boolean;
}

export const DEFAULT_MONITORING_SETTINGS: FleetMonitoringSettings = {
  dormantTruckDays: 3,
  dormantTrailerDays: 3,
  driverIdleAlertHours: 48,
  enableAlerts: true,
};

// OOS reason categories for the Mark OOS dialog
export const OOS_REASON_CATEGORIES = [
  'Mechanical',
  'Accident',
  'Waiting for Parts',
  'Seasonal',
  'Pending Sale',
  'Compliance Hold',
  'Other',
] as const;

export type OOSReasonCategory = (typeof OOS_REASON_CATEGORIES)[number];

// Shared minimal interface for Mark OOS dialog
export interface OOSEquipmentRef {
  id: string;
  number: string;
  type: 'TRUCK' | 'TRAILER';
}

// Active load info for inventory tables
export interface ActiveLoadInfo {
  loadNumber: string;
  lane: string; // e.g. "IL → WI"
  pickupDate: Date | null;
  deliveryDate: Date | null;
  status: string;
}

// Fleet inventory item types
export interface TruckInventoryItem {
  id: string;
  truckNumber: string;
  make: string;
  model: string;
  year: number;
  status: TruckStatus;
  currentDriver: { id: string; name: string; driverNumber: string } | null;
  activeLoad: ActiveLoadInfo | null;
  lastLoad: { loadNumber: string; date: Date | null } | null;
  daysSinceLastLoad: number | null;
  samsaraLocation: { address: string; lat: number; lng: number } | null;
  oosInfo: {
    longTermOutOfService: boolean;
    reason: string | null;
    expectedReturnDate: Date | null;
  };
}

export interface TrailerInventoryItem {
  id: string;
  trailerNumber: string;
  type: string | null;
  make: string;
  model: string;
  year: number | null;
  status: TrailerStatus;
  assignedTruck: { id: string; truckNumber: string } | null;
  activeLoad: ActiveLoadInfo | null;
  lastLoad: { loadNumber: string; date: Date | null } | null;
  daysSinceLastLoad: number | null;
  samsaraLocation: { address: string; lat: number; lng: number } | null;
  oosInfo: {
    longTermOutOfService: boolean;
    reason: string | null;
    expectedReturnDate: Date | null;
  };
}

export interface InventoryResponse<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
