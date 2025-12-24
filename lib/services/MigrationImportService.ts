/**
 * Migration Import Service
 * Enhanced import service that handles field mapping and metadata storage
 */

import { prisma } from '@/lib/prisma';
import { FieldMappingService } from './FieldMappingService';
import type {
  FieldMapping,
  FieldMappingConfig,
  EntityType,
  MigrationMetadata,
  ImportResult,
} from '@/lib/types/migration';

export class MigrationImportService {
  /**
   * Import entity data with field mapping
   */
  static async importWithMapping(
    entityType: EntityType,
    data: Array<Record<string, any>>,
    mappingConfig: FieldMappingConfig | null,
    companyId: string,
    mcNumberId?: string | null,
    sourceSystem: string = 'ThirdPartyTMS'
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      created: 0,
      updated: 0,
      errors: [],
      metadataSummary: {
        totalUnmappedFields: 0,
        entitiesWithMetadata: 0,
      },
    };

    const mappings = mappingConfig?.mappings || [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Apply field mapping
        const { mappedData, metadata } = FieldMappingService.applyFieldMapping(
          row,
          mappings
        );

        // Build migration metadata
        const migrationMetadata: MigrationMetadata = {
          sourceSystem,
          sourceId: row.id || row[`${entityType.toLowerCase()}_id`] || undefined,
          migratedAt: new Date().toISOString(),
          migrationVersion: mappingConfig?.version || '1.0',
          unmappedFields: Object.keys(metadata).length > 0 ? metadata : undefined,
        };

        // Add metadata to mapped data if there are unmapped fields
        if (Object.keys(metadata).length > 0) {
          mappedData.metadata = migrationMetadata;
          result.metadataSummary!.totalUnmappedFields += Object.keys(metadata).length;
          result.metadataSummary!.entitiesWithMetadata++;
        }

        // Add company and MC number context
        mappedData.companyId = companyId;
        if (mcNumberId) {
          mappedData.mcNumberId = mcNumberId;
        }

        // Import based on entity type
        const importResult = await this.importEntity(
          entityType,
          mappedData,
          companyId
        );

        if (importResult.created) {
          result.created++;
        } else if (importResult.updated) {
          result.updated++;
        }
      } catch (error: any) {
        result.errors.push({
          row: i + 1,
          error: error.message || 'Failed to import row',
        });
      }
    }

    result.success = result.errors.length === 0;
    return result;
  }

  /**
   * Import a single entity
   */
  private static async importEntity(
    entityType: EntityType,
    data: Record<string, any>,
    companyId: string
  ): Promise<{ created: boolean; updated: boolean }> {
    // Map entity type to Prisma model
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

    const modelName = modelMap[entityType];
    if (!modelName) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    // Get unique identifier for this entity type
    const uniqueField = this.getUniqueField(entityType);
    if (!uniqueField || !data[uniqueField]) {
      throw new Error(`Missing unique identifier: ${uniqueField}`);
    }

    // Check if entity exists
    const existing = await (prisma as any)[modelName].findFirst({
      where: {
        [uniqueField]: data[uniqueField],
        companyId,
        deletedAt: null,
      },
    });

    if (existing) {
      // Update existing
      await (prisma as any)[modelName].update({
        where: { id: existing.id },
        data,
      });
      return { created: false, updated: true };
    } else {
      // Create new
      await (prisma as any)[modelName].create({
        data,
      });
      return { created: true, updated: false };
    }
  }

  /**
   * Get unique field for entity type
   */
  private static getUniqueField(entityType: EntityType): string | null {
    const uniqueFields: Record<EntityType, string> = {
      LOAD: 'loadNumber',
      LOAD_STOP: 'id', // No unique field, use ID
      LOAD_TEMPLATE: 'id',
      DRIVER: 'driverNumber',
      TRUCK: 'truckNumber',
      TRAILER: 'trailerNumber',
      CUSTOMER: 'customerNumber',
      VENDOR: 'vendorNumber',
      LOCATION: 'locationNumber',
      INVOICE: 'invoiceNumber',
      INVOICE_BATCH: 'batchNumber',
      SETTLEMENT: 'settlementNumber',
      SETTLEMENT_DEDUCTION: 'id',
      DRIVER_ADVANCE: 'advanceNumber',
      DRIVER_NEGATIVE_BALANCE: 'id',
      LOAD_EXPENSE: 'expenseNumber',
      PAYMENT: 'paymentNumber',
      RECONCILIATION: 'id',
      FACTORING_COMPANY: 'name',
      FACTORING_BATCH: 'id',
      ACCESSORIAL_CHARGE: 'id',
      RATE_CONFIRMATION: 'id',
      FUEL_ENTRY: 'fuelEntryNumber',
      MAINTENANCE_RECORD: 'maintenanceNumber',
      BREAKDOWN: 'breakdownNumber',
      INSPECTION: 'inspectionNumber',
      SAFETY_INCIDENT: 'incidentNumber',
      SAFETY_TRAINING: 'id',
      DVIR: 'id',
      ROADSIDE_INSPECTION: 'id',
      DRUG_ALCOHOL_TEST: 'id',
      MVR_RECORD: 'id',
      DOCUMENT: 'id',
      COMMUNICATION: 'ticketNumber',
      PROJECT: 'name',
      TASK: 'id',
    };

    return uniqueFields[entityType] || null;
  }
}







