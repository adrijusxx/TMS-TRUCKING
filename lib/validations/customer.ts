import { z } from 'zod';
import { CustomerType } from '@prisma/client';

export const createCustomerSchema = z.object({
  customerNumber: z.string().min(1, 'Customer number is required'),
  name: z.string().min(1, 'Customer name is required'),
  type: z.nativeEnum(CustomerType).default('DIRECT'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  zip: z.string().min(5, 'ZIP code is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email address'),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZip: z.string().optional(),
  billingEmail: z.string().email().optional().or(z.literal('')),
  paymentTerms: z.number().int().positive().default(30),
  creditLimit: z.number().nonnegative().optional(),
});

// Simplified schema for quick customer creation (from load form)
export const quickCreateCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Invalid email address'),
  customerNumber: z.string().optional(), // Will be auto-generated if not provided
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

