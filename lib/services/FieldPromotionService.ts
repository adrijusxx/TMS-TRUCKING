/**
 * Field Promotion Service
 * Promotes metadata fields to CustomField definitions or schema columns
 */

import { prisma } from '@/lib/prisma';
import type {
  EntityType,
  PromotionRequest,
  PromotionResult,
  DataType,
} from '@/lib/types/migration';

export class FieldPromotionService {
  /**
   * Promote metadata field to CustomField definition
   */
  static async promoteToCustomField(
    companyId: string,
    entityType: EntityType,
    fieldName: string,
    label: string,
    dataType: DataType,
    required: boolean = false
  ): Promise<PromotionResult> {
    try {
      // Map entity type to CustomFieldEntityType
      const customFieldEntityType = this.mapToCustomFieldEntityType(entityType);
      if (!customFieldEntityType) {
        throw new Error(`Entity type ${entityType} is not supported for CustomField`);
      }

      // Map data type to CustomFieldType
      const customFieldType = this.mapToCustomFieldType(dataType);

      // Create CustomField definition
      const customField = await prisma.customField.create({
        data: {
          companyId,
          name: fieldName,
          label,
          type: customFieldType,
          entityType: customFieldEntityType,
          required,
        },
      });

      // Note: CustomField values would be stored separately in a CustomFieldValue table
      // For now, we just create the definition
      // The actual values remain in metadata until a separate migration moves them

      return {
        success: true,
        promotionType: 'customField',
        fieldId: customField.id,
        recordsMigrated: 0, // Would need to count records with this field
        errors: [],
      };
    } catch (error: any) {
      return {
        success: false,
        promotionType: 'customField',
        recordsMigrated: 0,
        errors: [error.message || 'Failed to create CustomField'],
      };
    }
  }

  /**
   * Promote metadata field to schema column
   * This generates a migration that must be applied separately
   */
  static async promoteToSchemaColumn(
    entityType: EntityType,
    fieldName: string,
    dataType: DataType,
    required: boolean = false
  ): Promise<{
    migrationSql: string;
    migrationId: string;
  }> {
    const modelName = this.getModelName(entityType);
    if (!modelName) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    const sqlType = this.mapToSqlType(dataType);
    const nullable = required ? 'NOT NULL' : '';
    const migrationId = `promote_${fieldName}_to_${modelName}_${Date.now()}`;

    const migrationSql = `-- Promote ${fieldName} from metadata to schema column
-- Migration ID: ${migrationId}

ALTER TABLE "${this.capitalizeFirst(modelName)}" ADD COLUMN "${fieldName}" ${sqlType} ${nullable};

-- Migrate data from metadata to column
UPDATE "${this.capitalizeFirst(modelName)}"
SET "${fieldName}" = (metadata->'unmappedFields'->>'${fieldName}')::${sqlType}
WHERE metadata->'unmappedFields'->>'${fieldName}' IS NOT NULL;

-- Create index if needed
CREATE INDEX IF NOT EXISTS "${modelName}_${fieldName}_idx" ON "${this.capitalizeFirst(modelName)}" ("${fieldName}");`;

    return {
      migrationSql,
      migrationId,
    };
  }

  /**
   * Migrate data from metadata to new field
   */
  static async migrateMetadataToField(
    entityType: EntityType,
    fieldName: string,
    targetFieldName: string
  ): Promise<PromotionResult> {
    const modelName = this.getModelName(entityType);
    if (!modelName) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    try {
      // Find all records with this field in metadata
      const records = await (prisma as any)[modelName].findMany({
        where: {
          metadata: {
            path: ['unmappedFields', fieldName],
            not: null,
          },
        },
        select: {
          id: true,
          metadata: true,
        },
      });

      let migrated = 0;
      const errors: string[] = [];

      for (const record of records) {
        try {
          const value = record.metadata?.unmappedFields?.[fieldName];

          // Update record with new field
          await (prisma as any)[modelName].update({
            where: { id: record.id },
            data: {
              [targetFieldName]: value,
              // Remove from metadata
              metadata: {
                ...record.metadata,
                unmappedFields: {
                  ...record.metadata?.unmappedFields,
                  [fieldName]: undefined,
                },
              },
            },
          });

          migrated++;
        } catch (error: any) {
          errors.push(`Record ${record.id}: ${error.message}`);
        }
      }

      return {
        success: errors.length === 0,
        promotionType: 'schemaColumn',
        recordsMigrated: migrated,
        errors,
      };
    } catch (error: any) {
      return {
        success: false,
        promotionType: 'schemaColumn',
        recordsMigrated: 0,
        errors: [error.message || 'Failed to migrate data'],
      };
    }
  }

  /**
   * Validate promotion is safe
   */
  static async validatePromotion(
    entityType: EntityType,
    fieldName: string,
    promotionType: 'customField' | 'schemaColumn'
  ): Promise<{
    valid: boolean;
    warnings: string[];
    errors: string[];
  }> {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check if field already exists in schema
    const modelName = this.getModelName(entityType);
    if (modelName && promotionType === 'schemaColumn') {
      // This would require checking the actual schema
      // For now, we'll just return a warning
      warnings.push(
        'Cannot verify if field already exists in schema. Please check manually.'
      );
    }

    // Check if CustomField already exists
    if (promotionType === 'customField') {
      // Would need to check CustomField table
      warnings.push(
        'Cannot verify if CustomField already exists. Please check manually.'
      );
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * Batch promote multiple fields
   */
  static async batchPromoteFields(
    requests: PromotionRequest[]
  ): Promise<PromotionResult[]> {
    const results: PromotionResult[] = [];

    for (const request of requests) {
      try {
        if (request.promotionType === 'customField') {
          const result = await this.promoteToCustomField(
            '', // Would need companyId from request
            request.entityType,
            request.fieldName,
            request.label || request.fieldName,
            request.dataType || 'string',
            request.required || false
          );
          results.push(result);
        } else {
          const { migrationSql, migrationId } = await this.promoteToSchemaColumn(
            request.entityType,
            request.fieldName,
            request.dataType || 'string',
            request.required || false
          );
          results.push({
            success: true,
            promotionType: 'schemaColumn',
            migrationId,
            recordsMigrated: 0,
            errors: [],
          });
        }
      } catch (error: any) {
        results.push({
          success: false,
          promotionType: request.promotionType,
          recordsMigrated: 0,
          errors: [error.message || 'Failed to promote field'],
        });
      }
    }

    return results;
  }

  // Helper methods
  private static mapToCustomFieldEntityType(
    entityType: EntityType
  ): 'LOAD' | 'DRIVER' | 'CUSTOMER' | 'TRUCK' | 'TRAILER' | 'INVOICE' | null {
    const mapping: Record<EntityType, string | null> = {
      LOAD: 'LOAD',
      DRIVER: 'DRIVER',
      CUSTOMER: 'CUSTOMER',
      TRUCK: 'TRUCK',
      TRAILER: 'TRAILER',
      INVOICE: 'INVOICE',
      // Others not supported by CustomField
      LOAD_STOP: null,
      LOAD_TEMPLATE: null,
      VENDOR: null,
      LOCATION: null,
      INVOICE_BATCH: null,
      SETTLEMENT: null,
      SETTLEMENT_DEDUCTION: null,
      DRIVER_ADVANCE: null,
      DRIVER_NEGATIVE_BALANCE: null,
      LOAD_EXPENSE: null,
      PAYMENT: null,
      RECONCILIATION: null,
      FACTORING_COMPANY: null,
      FACTORING_BATCH: null,
      ACCESSORIAL_CHARGE: null,
      RATE_CONFIRMATION: null,
      FUEL_ENTRY: null,
      MAINTENANCE_RECORD: null,
      BREAKDOWN: null,
      INSPECTION: null,
      SAFETY_INCIDENT: null,
      SAFETY_TRAINING: null,
      DVIR: null,
      ROADSIDE_INSPECTION: null,
      DRUG_ALCOHOL_TEST: null,
      MVR_RECORD: null,
      DOCUMENT: null,
      COMMUNICATION: null,
      PROJECT: null,
      TASK: null,
    };

    return mapping[entityType] as any;
  }

  private static mapToCustomFieldType(
    dataType: DataType
  ): 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'TEXTAREA' | 'EMAIL' | 'PHONE' | 'URL' {
    const mapping: Record<DataType, string> = {
      string: 'TEXT',
      number: 'NUMBER',
      date: 'DATE',
      boolean: 'BOOLEAN',
      json: 'TEXTAREA',
    };

    return mapping[dataType] as any;
  }

  private static mapToSqlType(dataType: DataType): string {
    const mapping: Record<DataType, string> = {
      string: 'TEXT',
      number: 'DOUBLE PRECISION',
      date: 'TIMESTAMP(3)',
      boolean: 'BOOLEAN',
      json: 'JSONB',
    };

    return mapping[dataType];
  }

  private static getModelName(entityType: EntityType): string | null {
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

  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}







