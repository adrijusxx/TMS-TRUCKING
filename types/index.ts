import { UserRole, LoadStatus, DriverStatus, TruckStatus } from '@prisma/client';

export type {
  UserRole,
  LoadStatus,
  DriverStatus,
  TruckStatus
};

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: string;
}

export interface Load {
  id: string;
  loadNumber: string;
  status: LoadStatus;
  customerId: string;
  driverId?: string;
  truckId?: string;
  pickupCity: string;
  pickupState: string;
  pickupDate: Date;
  deliveryCity: string;
  deliveryState: string;
  deliveryDate: Date;
  revenue: number;
  driverPay?: number;
  weight: number;
}

// Add more types as needed

