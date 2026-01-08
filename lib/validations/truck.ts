import { z } from 'zod';
import { EquipmentType, TruckStatus } from '@prisma/client';

export const createTruckSchema = z.object({
  truckNumber: z.string().min(1, 'Truck number is required'),
  vin: z.string().min(1, 'VIN is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  licensePlate: z.string().min(1, 'License plate is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  equipmentType: z.nativeEnum(EquipmentType),
  capacity: z.number().positive('Capacity must be positive'),
  registrationExpiry: z.string().or(z.date()),
  insuranceExpiry: z.string().or(z.date()),
  inspectionExpiry: z.string().or(z.date()),
  odometerReading: z.number().nonnegative().default(0),
  eldInstalled: z.boolean().default(false),
  eldProvider: z.string().optional(),
  gpsInstalled: z.boolean().default(false),
  mcNumberId: z.string().optional(),
});

export const updateTruckSchema = createTruckSchema.partial().extend({
  status: z.nativeEnum(TruckStatus).optional(),
  currentDriverId: z.string().optional(),
  mcNumberId: z.string().min(1, 'MC number is required').nullable().optional(),
});

export type CreateTruckInput = z.infer<typeof createTruckSchema>;
type UpdateTruckInput = z.infer<typeof updateTruckSchema>;

