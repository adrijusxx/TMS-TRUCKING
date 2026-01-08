import { z } from 'zod';
import { EquipmentType } from '@prisma/client';

export const createTrailerSchema = z.object({
  trailerNumber: z.string().min(1, 'Trailer number is required'),
  vin: z.string().optional(),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  licensePlate: z.string().optional(),
  state: z.string().length(2, 'State must be 2 characters').optional(),
  type: z.string().optional(),
  ownership: z.string().optional(),
  ownerName: z.string().optional(),
  assignedTruckId: z.string().optional(),
  operatorDriverId: z.string().optional(),
  status: z.string().optional(),
  fleetStatus: z.string().optional(),
  registrationExpiry: z.string().or(z.date()).optional(),
  insuranceExpiry: z.string().or(z.date()).optional(),
  inspectionExpiry: z.string().or(z.date()).optional(),
  mcNumberId: z.string().optional(),
});

const updateTrailerSchema = createTrailerSchema.partial().extend({
  mcNumberId: z.string().min(1, 'MC number is required').nullable().optional(),
});

export type CreateTrailerInput = z.infer<typeof createTrailerSchema>;
type UpdateTrailerInput = z.infer<typeof updateTrailerSchema>;





