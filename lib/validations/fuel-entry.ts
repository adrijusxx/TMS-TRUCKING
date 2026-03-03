import { z } from 'zod';

export const createFuelEntrySchema = z.object({
  truckId: z.string().min(1, 'Truck is required'),
  driverId: z.string().optional().nullable(),
  mcNumberId: z.string().optional().nullable(),
  date: z.coerce.date(),
  gallons: z.number().positive('Gallons must be positive'),
  costPerGallon: z.number().positive('Cost per gallon must be positive'),
  totalCost: z.number().nonnegative('Total cost must be non-negative'),
  odometer: z.number().int().nonnegative('Odometer must be non-negative'),
  location: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  fuelType: z.enum(['DIESEL', 'GAS', 'DEF']).default('DIESEL'),
  receiptNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  vendor: z.string().optional().nullable(),
  state: z.string().max(2).optional().nullable(),
});

export const updateFuelEntrySchema = createFuelEntrySchema.partial();

export type CreateFuelEntryInput = z.infer<typeof createFuelEntrySchema>;
export type UpdateFuelEntryInput = z.infer<typeof updateFuelEntrySchema>;
