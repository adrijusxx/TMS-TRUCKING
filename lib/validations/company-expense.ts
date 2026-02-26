import { z } from 'zod';

export const createCompanyExpenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  date: z.string().datetime().or(z.date()),
  description: z.string().min(1, 'Description is required').max(500),
  expenseTypeId: z.string().min(1, 'Expense type is required'),
  department: z
    .enum(['OPERATIONS', 'FLEET', 'RECRUITING', 'DISPATCH', 'SAFETY', 'ACCOUNTING', 'ADMIN', 'OTHER'])
    .default('OTHER'),
  paymentInstrumentId: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  vendorName: z.string().max(200).optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
  documentIds: z.array(z.string()).optional().default([]),
  hasReceipt: z.boolean().optional().default(false),
  isRecurring: z.boolean().optional().default(false),
  recurringFrequency: z
    .enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL'])
    .optional()
    .nullable(),
  notes: z.string().max(1000).optional().nullable(),
  mcNumberId: z.string().optional().nullable(),
});

export const updateCompanyExpenseSchema = createCompanyExpenseSchema.partial();

export const approveCompanyExpenseSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().max(500).optional().nullable(),
});

export const createCompanyExpenseTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(300).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')
    .optional()
    .nullable(),
  sortOrder: z.number().int().optional().default(0),
  mcNumberId: z.string().optional().nullable(),
});

export const updateCompanyExpenseTypeSchema = createCompanyExpenseTypeSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export const upsertDepartmentBudgetSchema = z.object({
  department: z.enum([
    'OPERATIONS',
    'FLEET',
    'RECRUITING',
    'DISPATCH',
    'SAFETY',
    'ACCOUNTING',
    'ADMIN',
    'OTHER',
  ]),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  budgetAmount: z.number().nonnegative(),
  mcNumberId: z.string().optional().nullable(),
});

export type CreateCompanyExpenseInput = z.infer<typeof createCompanyExpenseSchema>;
export type UpdateCompanyExpenseInput = z.infer<typeof updateCompanyExpenseSchema>;
export type CreateCompanyExpenseTypeInput = z.infer<typeof createCompanyExpenseTypeSchema>;
export type UpdateCompanyExpenseTypeInput = z.infer<typeof updateCompanyExpenseTypeSchema>;
export type UpsertDepartmentBudgetInput = z.infer<typeof upsertDepartmentBudgetSchema>;
