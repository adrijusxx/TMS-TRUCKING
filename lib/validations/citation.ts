import { z } from 'zod';

export const createCitationSchema = z.object({
  citationNumber: z.string().min(1, 'Citation number is required'),
  citationType: z.string().min(1, 'Citation type is required'),
  citationDate: z.coerce.date(),
  driverId: z.string().optional().nullable(),
  truckId: z.string().optional().nullable(),
  trailerId: z.string().optional().nullable(),
  courtDate: z.coerce.date().optional().nullable(),
  courtLocation: z.string().optional().nullable(),
  fineAmount: z.number().optional().nullable(),
  violationCode: z.string().optional().nullable(),
  issuingAgency: z.string().optional().nullable(),
  officerName: z.string().optional().nullable(),
  officerBadge: z.string().optional().nullable(),
  recordable: z.boolean().optional(),
  pointsAssessed: z.number().int().optional().nullable(),
});

export const updateCitationSchema = createCitationSchema.partial().extend({
  status: z.enum(['OPEN', 'PENDING_COURT', 'RESOLVED', 'DISMISSED', 'PAID']).optional(),
  resolution: z.string().optional().nullable(),
  paidAmount: z.number().optional().nullable(),
});

export type CreateCitationInput = z.infer<typeof createCitationSchema>;
export type UpdateCitationInput = z.infer<typeof updateCitationSchema>;
