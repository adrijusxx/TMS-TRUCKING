/**
 * Migration Validation Schemas
 * Zod schemas for validating migration-related data
 */

import { z } from 'zod';
import type { EntityType, DataType } from '@/lib/types/migration';

export const entityTypeSchema = z.enum([
  'LOAD',
  'LOAD_STOP',
  'LOAD_TEMPLATE',
  'DRIVER',
  'TRUCK',
  'TRAILER',
  'CUSTOMER',
  'VENDOR',
  'LOCATION',
  'INVOICE',
  'INVOICE_BATCH',
  'SETTLEMENT',
  'SETTLEMENT_DEDUCTION',
  'DRIVER_ADVANCE',
  'DRIVER_NEGATIVE_BALANCE',
  'LOAD_EXPENSE',
  'PAYMENT',
  'RECONCILIATION',
  'FACTORING_COMPANY',
  'FACTORING_BATCH',
  'ACCESSORIAL_CHARGE',
  'RATE_CONFIRMATION',
  'FUEL_ENTRY',
  'MAINTENANCE_RECORD',
  'BREAKDOWN',
  'INSPECTION',
  'SAFETY_INCIDENT',
  'SAFETY_TRAINING',
  'DVIR',
  'ROADSIDE_INSPECTION',
  'DRUG_ALCOHOL_TEST',
  'MVR_RECORD',
  'DOCUMENT',
  'COMMUNICATION',
  'PROJECT',
  'TASK',
]);

export const dataTypeSchema = z.enum(['string', 'number', 'date', 'boolean', 'json']);

export const fieldMappingSchema = z.object({
  sourceField: z.string().min(1),
  targetField: z.string().nullable(),
  dataType: dataTypeSchema,
  transform: z.custom<((value: any) => any) | undefined>().optional(),
  required: z.boolean().optional(),
  entityType: entityTypeSchema,
  description: z.string().optional(),
});

export const migrationMetadataSchema = z.object({
  sourceSystem: z.string().min(1),
  sourceId: z.string().optional(),
  migratedAt: z.string().datetime(),
  migrationVersion: z.string(),
  unmappedFields: z.record(z.string(), z.any()).optional(),
  financialFields: z.record(z.string(), z.any()).optional(),
});

export const fieldMappingConfigSchema = z.object({
  id: z.string().optional(),
  companyId: z.string().min(1),
  entityType: entityTypeSchema,
  mappings: z.array(fieldMappingSchema),
  sourceSystem: z.string().min(1),
  version: z.string().min(1),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const promotionRequestSchema = z.object({
  entityType: entityTypeSchema,
  fieldName: z.string().min(1),
  promotionType: z.enum(['customField', 'schemaColumn']),
  dataType: dataTypeSchema.optional(),
  label: z.string().optional(),
  required: z.boolean().optional(),
});

export const importRequestSchema = z.object({
  entityType: entityTypeSchema,
  data: z.array(z.record(z.string(), z.any())),
  mappingConfig: fieldMappingConfigSchema.nullable().optional(),
  sourceSystem: z.string().optional(),
});

