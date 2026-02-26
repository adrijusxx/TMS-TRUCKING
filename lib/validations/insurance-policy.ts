import { z } from 'zod';

export const createInsurancePolicySchema = z.object({
  policyType: z.enum(['LIABILITY', 'PHYSICAL_DAMAGE', 'CARGO', 'GENERAL_LIABILITY']),
  policyNumber: z.string().min(1, 'Policy number is required'),
  insuranceCompany: z.string().min(1, 'Insurance company is required'),
  agentName: z.string().optional().nullable(),
  agentPhone: z.string().optional().nullable(),
  agentEmail: z.string().email().optional().nullable(),
  coverageLimit: z.number().min(0).optional().nullable(),
  deductible: z.number().min(0).optional().nullable(),
  effectiveDate: z.coerce.date(),
  renewalDate: z.coerce.date(),
});

export const updateInsurancePolicySchema = createInsurancePolicySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateInsurancePolicyInput = z.infer<typeof createInsurancePolicySchema>;
export type UpdateInsurancePolicyInput = z.infer<typeof updateInsurancePolicySchema>;
