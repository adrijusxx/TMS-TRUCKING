/**
 * Migration Analysis Service
 * Analyzes metadata usage and generates field promotion recommendations
 */

import { prisma } from '@/lib/prisma';
import type {
  EntityType,
  FieldAnalysis,
  EntityAnalysis,
} from '@/lib/types/migration';

export class MigrationAnalysisService {
  /**
   * Analyze metadata usage across all entities
   */
  static async analyzeMetadataUsage(
    companyId: string,
    entityType?: EntityType
  ): Promise<EntityAnalysis[]> {
    const entityTypes: EntityType[] = entityType
      ? [entityType]
      : [
          'LOAD',
          'DRIVER',
          'CUSTOMER',
          'INVOICE',
          'SETTLEMENT',
          'PAYMENT',
          'TRUCK',
          'TRAILER',
        ];

    const analyses: EntityAnalysis[] = [];

    for (const et of entityTypes) {
      const analysis = await this.analyzeEntity(companyId, et);
      if (analysis) {
        analyses.push(analysis);
      }
    }

    return analyses;
  }

  /**
   * Analyze specific entity
   */
  private static async analyzeEntity(
    companyId: string,
    entityType: EntityType
  ): Promise<EntityAnalysis | null> {
    const modelName = this.getModelName(entityType);
    if (!modelName) return null;

    try {
      const allRecords = await (prisma as any)[modelName].findMany({
        where: {
          companyId,
          deletedAt: null,
        },
        select: {
          id: true,
          metadata: true,
        },
      });

      const totalRecords = allRecords.length;
      const recordsWithMetadata = allRecords.filter(
        (r: any) => r.metadata && typeof r.metadata === 'object'
      ).length;

      // Extract all field names from metadata
      const fieldMap = new Map<string, any[]>();
      for (const record of allRecords) {
        if (record.metadata?.unmappedFields) {
          for (const [fieldName, value] of Object.entries(
            record.metadata.unmappedFields
          )) {
            if (!fieldMap.has(fieldName)) {
              fieldMap.set(fieldName, []);
            }
            fieldMap.get(fieldName)!.push(value);
          }
        }
      }

      // Analyze each field
      const fields: FieldAnalysis[] = [];
      for (const [fieldName, values] of fieldMap.entries()) {
        const nonNullValues = values.filter((v) => v !== null && v !== undefined);
        const uniqueValues = new Set(nonNullValues.map((v) => String(v)));

        const analysis: FieldAnalysis = {
          fieldName,
          usageCount: nonNullValues.length,
          usagePercentage: (nonNullValues.length / totalRecords) * 100,
          dataType: this.inferDataType(nonNullValues),
          nullCount: values.length - nonNullValues.length,
          uniqueValues: uniqueValues.size,
          sampleValues: Array.from(uniqueValues).slice(0, 5),
          recommendation: this.getRecommendation(
            nonNullValues.length,
            totalRecords,
            uniqueValues.size
          ),
          recommendationReason: this.getRecommendationReason(
            nonNullValues.length,
            totalRecords,
            uniqueValues.size
          ),
        };

        fields.push(analysis);
      }

      // Sort by usage count
      fields.sort((a, b) => b.usageCount - a.usageCount);

      return {
        entityType,
        totalRecords,
        recordsWithMetadata,
        fields,
        topFields: fields.slice(0, 10),
      };
    } catch (error) {
      console.error(`Error analyzing ${entityType}:`, error);
      return null;
    }
  }

  /**
   * Identify frequently used metadata fields
   */
  static async identifyFrequentFields(
    companyId: string,
    entityType: EntityType,
    threshold: number = 50
  ): Promise<FieldAnalysis[]> {
    const analysis = await this.analyzeEntity(companyId, entityType);
    if (!analysis) return [];

    return analysis.fields.filter(
      (f) => f.usagePercentage >= threshold && f.recommendation === 'promote'
    );
  }

  /**
   * Generate promotion recommendations
   */
  static async generatePromotionRecommendations(
    companyId: string,
    entityType?: EntityType
  ): Promise<Array<{
    entityType: EntityType;
    fieldName: string;
    recommendation: 'customField' | 'schemaColumn';
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>> {
    const analyses = await this.analyzeMetadataUsage(companyId, entityType);
    const recommendations: Array<{
      entityType: EntityType;
      fieldName: string;
      recommendation: 'customField' | 'schemaColumn';
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    for (const analysis of analyses) {
      for (const field of analysis.fields) {
        if (field.recommendation === 'promote') {
          // Determine if should be CustomField or schema column
          const shouldBeSchemaColumn =
            field.usagePercentage >= 80 &&
            field.uniqueValues < 100 &&
            field.dataType !== 'json';

          recommendations.push({
            entityType: analysis.entityType,
            fieldName: field.fieldName,
            recommendation: shouldBeSchemaColumn ? 'schemaColumn' : 'customField',
            reason: field.recommendationReason,
            priority:
              field.usagePercentage >= 80
                ? 'high'
                : field.usagePercentage >= 50
                  ? 'medium'
                  : 'low',
          });
        }
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Calculate field statistics
   */
  static async calculateFieldStatistics(
    companyId: string,
    entityType: EntityType,
    fieldName: string
  ): Promise<{
    totalRecords: number;
    recordsWithField: number;
    nullCount: number;
    uniqueValues: number;
    dataType: string;
    sampleValues: any[];
  }> {
    const modelName = this.getModelName(entityType);
    if (!modelName) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    const records = await (prisma as any)[modelName].findMany({
      where: {
        companyId,
        deletedAt: null,
        metadata: {
          path: ['unmappedFields', fieldName],
          not: null,
        },
      },
      select: {
        metadata: true,
      },
    });

    const values = records.map(
      (r: any) => r.metadata?.unmappedFields?.[fieldName]
    );
    const nonNullValues = values.filter((v: any) => v !== null && v !== undefined);
    const uniqueValues = new Set(nonNullValues.map((v: any) => String(v)));

    return {
      totalRecords: records.length,
      recordsWithField: nonNullValues.length,
      nullCount: values.length - nonNullValues.length,
      uniqueValues: uniqueValues.size,
      dataType: this.inferDataType(nonNullValues),
      sampleValues: Array.from(uniqueValues).slice(0, 10),
    };
  }

  /**
   * Special analysis for accounting fields
   */
  static async analyzeAccountingFields(
    companyId: string
  ): Promise<{
    invoices: EntityAnalysis | null;
    settlements: EntityAnalysis | null;
    payments: EntityAnalysis | null;
    financialIntegrity: {
      invoiceTotal: number;
      paymentTotal: number;
      settlementTotal: number;
      discrepancies: string[];
    };
  }> {
    const [invoices, settlements, payments] = await Promise.all([
      this.analyzeEntity(companyId, 'INVOICE'),
      this.analyzeEntity(companyId, 'SETTLEMENT'),
      this.analyzeEntity(companyId, 'PAYMENT'),
    ]);

    // Calculate financial totals from metadata
    const invoiceRecords = await prisma.invoice.findMany({
      where: { companyId, deletedAt: null },
      select: { total: true, metadata: true } as any,
    });

    // Payment doesn't have companyId directly - filter via invoice or mcNumber relation
    const paymentRecords = await prisma.payment.findMany({
      where: {
        OR: [
          { invoice: { companyId } },
          { mcNumber: { companyId } },
        ],
      },
      select: { amount: true, metadata: true } as any,
    });

    // Settlement doesn't have companyId directly - filter via driver relation
    const settlementRecords = await prisma.settlement.findMany({
      where: { driver: { companyId } },
      select: { grossPay: true, metadata: true } as any,
    });

    const invoiceTotal = invoiceRecords.reduce((sum, r: any) => sum + (r.total || 0), 0);
    const paymentTotal = paymentRecords.reduce((sum, r: any) => sum + (r.amount || 0), 0);
    const settlementTotal = settlementRecords.reduce(
      (sum, r: any) => sum + (r.grossPay || 0),
      0
    );

    const discrepancies: string[] = [];
    // Add validation logic here

    return {
      invoices,
      settlements,
      payments,
      financialIntegrity: {
        invoiceTotal,
        paymentTotal,
        settlementTotal,
        discrepancies,
      },
    };
  }

  // Helper methods
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

  private static inferDataType(values: any[]): 'string' | 'number' | 'date' | 'boolean' | 'json' {
    if (values.length === 0) return 'string';

    const firstValue = values[0];
    if (typeof firstValue === 'number') return 'number';
    if (typeof firstValue === 'boolean') return 'boolean';
    if (firstValue instanceof Date) return 'date';
    if (typeof firstValue === 'object') return 'json';

    // Try to detect date strings
    if (typeof firstValue === 'string') {
      const date = new Date(firstValue);
      if (!isNaN(date.getTime())) return 'date';
    }

    return 'string';
  }

  private static getRecommendation(
    usageCount: number,
    totalRecords: number,
    uniqueValues: number
  ): 'promote' | 'keep' | 'remove' {
    const usagePercentage = (usageCount / totalRecords) * 100;

    if (usagePercentage >= 50 && uniqueValues > 1) {
      return 'promote';
    } else if (usagePercentage < 10) {
      return 'remove';
    } else {
      return 'keep';
    }
  }

  private static getRecommendationReason(
    usageCount: number,
    totalRecords: number,
    uniqueValues: number
  ): string {
    const usagePercentage = (usageCount / totalRecords) * 100;

    if (usagePercentage >= 80) {
      return `High usage (${usagePercentage.toFixed(1)}%) - should be promoted to schema field`;
    } else if (usagePercentage >= 50) {
      return `Moderate usage (${usagePercentage.toFixed(1)}%) - consider promoting to CustomField`;
    } else if (usagePercentage < 10) {
      return `Low usage (${usagePercentage.toFixed(1)}%) - can be removed`;
    } else {
      return `Keep in metadata for now (${usagePercentage.toFixed(1)}% usage)`;
    }
  }
}

