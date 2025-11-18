import { z } from 'zod';
import { PayType, DriverStatus } from '@prisma/client';

export const createDriverSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  driverNumber: z.string().min(1, 'Driver number is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseState: z.string().length(2, 'State must be 2 characters'),
  licenseExpiry: z.string().or(z.date()),
  medicalCardExpiry: z.string().or(z.date()),
  drugTestDate: z.string().or(z.date()).optional(),
  backgroundCheck: z.string().or(z.date()).optional(),
  payType: z.nativeEnum(PayType),
  payRate: z.number().positive('Pay rate must be positive'),
  homeTerminal: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

export const updateDriverSchema = createDriverSchema.partial().extend({
  status: z.nativeEnum(DriverStatus).optional(),
  currentTruckId: z.string().optional(),
  password: z.string().min(8).optional(),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;

