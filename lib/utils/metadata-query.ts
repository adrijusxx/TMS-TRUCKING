/**
 * Metadata Query Utilities
 * Helper functions for querying and manipulating metadata fields
 */

import { prisma } from '@/lib/prisma';
import type { EntityType } from '@/lib/types/migration';

/**
 * Query specific metadata field
 */
export async function queryMetadataField(
  entityType: EntityType,
  companyId: string,
  fieldName: string,
  value?: any
): Promise<any[]> {
  const modelName = getModelName(entityType);
  if (!modelName) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  const where: any = {
    companyId,
    deletedAt: null,
  };

  if (value !== undefined) {
    where.metadata = {
      path: ['unmappedFields', fieldName],
      equals: value,
    };
  } else {
    where.metadata = {
      path: ['unmappedFields', fieldName],
      not: null,
    };
  }

  return (prisma as any)[modelName].findMany({
    where,
  });
}

/**
 * Extract all metadata fields from entity
 */
export function extractMetadataFields(entity: any): Record<string, any> {
  if (!entity?.metadata?.unmappedFields) {
    return {};
  }

  return entity.metadata.unmappedFields;
}

/**
 * Update specific metadata field
 */
export async function updateMetadataField(
  entityType: EntityType,
  entityId: string,
  fieldName: string,
  value: any
): Promise<void> {
  const modelName = getModelName(entityType);
  if (!modelName) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  const entity = await (prisma as any)[modelName].findUnique({
    where: { id: entityId },
    select: { metadata: true },
  });

  const currentMetadata = entity?.metadata || {};
  const currentUnmappedFields = currentMetadata.unmappedFields || {};

  await (prisma as any)[modelName].update({
    where: { id: entityId },
    data: {
      metadata: {
        ...currentMetadata,
        unmappedFields: {
          ...currentUnmappedFields,
          [fieldName]: value,
        },
      },
    },
  });
}

/**
 * Query entities by source system
 */
export async function queryMetadataBySource(
  entityType: EntityType,
  companyId: string,
  sourceSystem: string
): Promise<any[]> {
  const modelName = getModelName(entityType);
  if (!modelName) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  return (prisma as any)[modelName].findMany({
    where: {
      companyId,
      deletedAt: null,
      metadata: {
        path: ['sourceSystem'],
        equals: sourceSystem,
      },
    },
  });
}

/**
 * Get accounting-specific metadata helpers
 */
export async function getAccountingMetadata(
  entityType: 'INVOICE' | 'SETTLEMENT' | 'PAYMENT',
  entityId: string
): Promise<{
  sourceSystem?: string;
  sourceId?: string;
  financialFields?: Record<string, any>;
  unmappedFields?: Record<string, any>;
}> {
  const modelName = getModelName(entityType);
  if (!modelName) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  const entity = await (prisma as any)[modelName].findUnique({
    where: { id: entityId },
    select: { metadata: true },
  });

  if (!entity?.metadata) {
    return {};
  }

  return {
    sourceSystem: entity.metadata.sourceSystem,
    sourceId: entity.metadata.sourceId,
    financialFields: entity.metadata.financialFields,
    unmappedFields: entity.metadata.unmappedFields,
  };
}

// Helper function
function getModelName(entityType: EntityType): string | null {
  const modelMap: Record<EntityType, string> = {
    LOAD: 'load',
    LOAD_STOP: 'loadStop',
    LOAD_TEMPLATE: 'loadTemplate',
    DRIVER: 'driver',
    TRUCK: 'truck',
    TRAILER: 'trailer',
    CUSTOMER: 'customer',
    VENDOR: 'vendor',
    LOCATION: 'location',
    INVOICE: 'invoice',
    INVOICE_BATCH: 'invoiceBatch',
    SETTLEMENT: 'settlement',
    SETTLEMENT_DEDUCTION: 'settlementDeduction',
    DRIVER_ADVANCE: 'driverAdvance',
    DRIVER_NEGATIVE_BALANCE: 'driverNegativeBalance',
    LOAD_EXPENSE: 'loadExpense',
    PAYMENT: 'payment',
    RECONCILIATION: 'reconciliation',
    FACTORING_COMPANY: 'factoringCompany',
    FACTORING_BATCH: 'factoringBatch',
    ACCESSORIAL_CHARGE: 'accessorialCharge',
    RATE_CONFIRMATION: 'rateConfirmation',
    FUEL_ENTRY: 'fuelEntry',
    MAINTENANCE_RECORD: 'maintenanceRecord',
    BREAKDOWN: 'breakdown',
    INSPECTION: 'inspection',
    SAFETY_INCIDENT: 'safetyIncident',
    SAFETY_TRAINING: 'safetyTraining',
    DVIR: 'dvir',
    ROADSIDE_INSPECTION: 'roadsideInspection',
    DRUG_ALCOHOL_TEST: 'drugAlcoholTest',
    MVR_RECORD: 'mvrRecord',
    DOCUMENT: 'document',
    COMMUNICATION: 'communication',
    PROJECT: 'project',
    TASK: 'task',
  };

  return modelMap[entityType] || null;
}







