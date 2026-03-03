import { z } from 'zod';

export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.union([
    z.string().min(8, 'Password must be at least 8 characters'),
    z.literal(''),
  ]).optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'CUSTOMER', 'HR', 'SAFETY', 'FLEET']),
  roleId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  mcNumberId: z.string().optional(),
  mcAccess: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.role !== 'ADMIN' && data.mcAccess !== undefined && (!data.mcAccess || data.mcAccess.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'At least one MC number must be selected',
  path: ['mcAccess'],
});

export type UserFormData = z.infer<typeof userSchema>;

export interface CustomRole {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export type SortField = 'firstName' | 'lastName' | 'email' | 'role' | 'isActive' | 'lastLogin' | null;
export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnVisibility {
  checkbox: boolean;
  name: boolean;
  email: boolean;
  password: boolean;
  phone: boolean;
  role: boolean;
  mcAccess: boolean;
  status: boolean;
  lastLogin: boolean;
  actions: boolean;
}

export const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  DISPATCHER: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  ACCOUNTANT: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  HR: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
  SAFETY: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  FLEET: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
  DRIVER: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  CUSTOMER: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
};
