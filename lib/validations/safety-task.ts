import { z } from 'zod';

export const createSafetyTaskSchema = z.object({
  taskType: z.enum(['ACCIDENT_CLAIM', 'INSPECTION', 'CITATION', 'GENERAL']),
  date: z.coerce.date(),
  dueDate: z.coerce.date().optional().nullable(),
  driverId: z.string().optional().nullable(),
  truckId: z.string().optional().nullable(),
  trailerId: z.string().optional().nullable(),
  loadId: z.string().optional().nullable(),
  mcNumberId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  driverAmount: z.number().optional().nullable(),
  totalAmount: z.number().optional().nullable(),
  location: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
});

export const updateSafetyTaskSchema = createSafetyTaskSchema.partial().extend({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).optional(),
  isLocked: z.boolean().optional(),
  driverCompStatus: z.enum(['PENDING', 'APPROVED', 'DENIED']).optional().nullable(),
  settlementId: z.string().optional().nullable(),
});

export type CreateSafetyTaskInput = z.infer<typeof createSafetyTaskSchema>;
export type UpdateSafetyTaskInput = z.infer<typeof updateSafetyTaskSchema>;
