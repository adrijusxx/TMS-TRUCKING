import { z } from 'zod';

export const createSafetyPolicySchema = z.object({
  policyName: z.string().min(1, 'Policy name is required'),
  category: z.enum(['ACCIDENT_PROCEDURES', 'DRUG_ALCOHOL_POLICY', 'VEHICLE_USE_POLICY', 'PERSONAL_CONDUCT', 'OTHER']),
  content: z.string().min(1, 'Policy content is required'),
  effectiveDate: z.coerce.date(),
});

export const updateSafetyPolicySchema = createSafetyPolicySchema.partial();

export const distributePolicySchema = z.object({
  driverIds: z.array(z.string().min(1)).min(1, 'At least one driver is required'),
});

export const acknowledgePolicySchema = z.object({
  signature: z.string().optional(),
});

export type CreateSafetyPolicyInput = z.infer<typeof createSafetyPolicySchema>;
export type UpdateSafetyPolicyInput = z.infer<typeof updateSafetyPolicySchema>;
