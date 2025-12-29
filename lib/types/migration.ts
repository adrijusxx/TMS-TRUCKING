/**
 * Migration Types
 * Type definitions for field mapping and migration metadata
 */

export type DataType = 'string' | 'number' | 'date' | 'boolean' | 'json';

export type EntityType =
  | 'LOAD'
  | 'LOAD_STOP'
  | 'LOAD_TEMPLATE'
  | 'DRIVER'
  | 'TRUCK'
  | 'TRAILER'
  | 'CUSTOMER'
  | 'VENDOR'
  | 'LOCATION'
  | 'INVOICE'
  | 'INVOICE_BATCH'
  | 'SETTLEMENT'
  | 'SETTLEMENT_DEDUCTION'
  | 'DRIVER_ADVANCE'
  | 'DRIVER_NEGATIVE_BALANCE'
  | 'LOAD_EXPENSE'
  | 'PAYMENT'
  | 'RECONCILIATION'
  | 'FACTORING_COMPANY'
  | 'FACTORING_BATCH'
  | 'ACCESSORIAL_CHARGE'
  | 'RATE_CONFIRMATION'
  | 'FUEL_ENTRY'
  | 'MAINTENANCE_RECORD'
  | 'BREAKDOWN'
  | 'INSPECTION'
  | 'SAFETY_INCIDENT'
  | 'SAFETY_TRAINING'
  | 'DVIR'
  | 'ROADSIDE_INSPECTION'
  | 'DRUG_ALCOHOL_TEST'
  | 'MVR_RECORD'
  | 'DOCUMENT'
  | 'COMMUNICATION'
  | 'PROJECT'
  | 'TASK';

export interface FieldMapping {
  sourceField: string;
  targetField: string | null; // null = store in metadata
  dataType: DataType;
  transform?: (value: any) => any;
  required?: boolean;
  entityType: EntityType;
  description?: string;
}

export interface FieldMappingConfig {
  id?: string;
  companyId: string;
  entityType: EntityType;
  mappings: FieldMapping[];
  sourceSystem: string;
  version: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MigrationMetadata {
  sourceSystem: string;
  sourceId?: string;
  migratedAt: string;
  migrationVersion: string;
  unmappedFields?: Record<string, any>;
  financialFields?: Record<string, any>; // For accounting entities
}

export interface ImportResult {
  success: boolean;
  created: number;
  updated: number;
  errors: Array<{
    row: number;
    field?: string;
    error: string;
  }>;
  metadataSummary?: {
    totalUnmappedFields: number;
    entitiesWithMetadata: number;
  };
}

export interface PromotionRequest {
  entityType: EntityType;
  fieldName: string;
  promotionType: 'customField' | 'schemaColumn';
  dataType?: DataType;
  label?: string;
  required?: boolean;
}

export interface PromotionResult {
  success: boolean;
  promotionType: 'customField' | 'schemaColumn';
  fieldId?: string;
  migrationId?: string;
  recordsMigrated: number;
  errors?: string[];
}

export interface FieldAnalysis {
  fieldName: string;
  usageCount: number;
  usagePercentage: number;
  dataType: DataType;
  nullCount: number;
  uniqueValues: number;
  sampleValues: any[];
  recommendation: 'promote' | 'keep' | 'remove';
  recommendationReason: string;
}

export interface EntityAnalysis {
  entityType: EntityType;
  totalRecords: number;
  recordsWithMetadata: number;
  fields: FieldAnalysis[];
  topFields: FieldAnalysis[];
}







