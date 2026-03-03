import { z } from 'zod';

export const createMaintenanceRecordSchema = z.object({
  truckId: z.string().min(1, 'Truck is required'),
  type: z.enum(['PM_A', 'PM_B', 'TIRES', 'REPAIR']),
  description: z.string().min(1, 'Description is required'),
  cost: z.number().nonnegative('Cost must be non-negative'),
  odometer: z.number().nonnegative('Odometer must be non-negative'),
  date: z.coerce.date(),
  nextServiceDate: z.coerce.date().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('OPEN'),
  notes: z.string().optional().nullable(),
});

export const updateMaintenanceRecordSchema = createMaintenanceRecordSchema.partial();

export type CreateMaintenanceRecordInput = z.infer<typeof createMaintenanceRecordSchema>;
export type UpdateMaintenanceRecordInput = z.infer<typeof updateMaintenanceRecordSchema>;
