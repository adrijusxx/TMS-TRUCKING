import { UserRole, LoadStatus, DriverStatus, TruckStatus, DetentionStartStrategy } from '@prisma/client';

export type {
  UserRole,
  LoadStatus,
  DriverStatus,
  TruckStatus,
  DetentionStartStrategy
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
  // Billing Hold Fields (AR/AP Decoupling)
  isBillingHold?: boolean;
  billingHoldReason?: string | null;
  detentionStartStrategy?: DetentionStartStrategy | null;
}

export interface LoadStop {
  id: string;
  loadId: string;
  stopType: 'PICKUP' | 'DELIVERY';
  sequence: number;
  company?: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string | null;
  // Timing
  earliestArrival?: Date | null;
  latestArrival?: Date | null;
  actualArrival?: Date | null;
  actualDeparture?: Date | null;
  // Detention Calculation Fields
  billableDetentionMinutes?: number | null;
  detentionClockStart?: Date | null;
}

// Add more types as needed

