import { z } from 'zod';

export const createPaymentInstrumentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  institutionName: z.string().min(1, 'Institution name is required').max(100),
  type: z.enum([
    'CREDIT_CARD',
    'DEBIT_CARD',
    'BANK_ACCOUNT',
    'ZELLE',
    'CASHAPP',
    'VENMO',
    'EFS',
    'COMDATA',
    'CASH',
    'OTHER',
  ]),
  lastFour: z.string().length(4).regex(/^\d{4}$/, 'Must be exactly 4 digits').optional().nullable(),
  cardholderName: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional().nullable(),
  monthlyLimit: z.number().positive().optional().nullable(),
  alertThreshold: z.number().positive().optional().nullable(),
  mcNumberId: z.string().optional().nullable(),
});

export const updatePaymentInstrumentSchema = createPaymentInstrumentSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export type CreatePaymentInstrumentInput = z.infer<typeof createPaymentInstrumentSchema>;
export type UpdatePaymentInstrumentInput = z.infer<typeof updatePaymentInstrumentSchema>;
