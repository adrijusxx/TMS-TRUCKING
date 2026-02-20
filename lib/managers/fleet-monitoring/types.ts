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
