/**
 * Accounting Migration Service
 * Special handling for financial entities during migration
 */

import { prisma } from '@/lib/prisma';
import { MigrationImportService } from './MigrationImportService';
import type {
  EntityType,
  FieldMappingConfig,
  ImportResult,
} from '@/lib/types/migration';

export class AccountingMigrationService {
  /**
   * Bulk import accounting entities in correct order with relationship preservation
   */
  static async bulkImportAccounting(
    data: {
      invoices?: Array<Record<string, any>>;
      invoiceBatches?: Array<Record<string, any>>;
      settlements?: Array<Record<string, any>>;
      payments?: Array<Record<string, any>>;
      reconciliations?: Array<Record<string, any>>;
      accessorialCharges?: Array<Record<string, any>>;
      rateConfirmations?: Array<Record<string, any>>;
      driverAdvances?: Array<Record<string, any>>;
      loadExpenses?: Array<Record<string, any>>;
    },
    mappingConfigs: Record<string, FieldMappingConfig | null>,
    companyId: string,
    mcNumberId?: string | null,
    sourceSystem: string = 'ThirdPartyTMS'
  ): Promise<{
    results: Record<string, ImportResult>;
    summary: {
      totalImported: number;
      totalErrors: number;
      financialTotals: {
        invoices: number;
        settlements: number;
        payments: number;
      };
    };
  }> {
    const results: Record<string, ImportResult> = {};
    const summary = {
      totalImported: 0,
      totalErrors: 0,
      financialTotals: {
        invoices: 0,
        settlements: 0,
        payments: 0,
      },
    };

    // Import order: Rate Confirmations -> Invoices -> Invoice Batches -> Settlements -> Payments -> Reconciliations
    // This ensures relationships are preserved

    // 1. Rate Confirmations (needed for invoices)
    if (data.rateConfirmations) {
      results.rateConfirmations = await MigrationImportService.importWithMapping(
        'RATE_CONFIRMATION',
        data.rateConfirmations,
        mappingConfigs.rateConfirmations || null,
        companyId,
        mcNumberId,
        sourceSystem
      );
      summary.totalImported += results.rateConfirmations.created;
      summary.totalErrors += results.rateConfirmations.errors.length;
    }

    // 2. Accessorial Charges (needed for invoices)
    if (data.accessorialCharges) {
      results.accessorialCharges = await MigrationImportService.importWithMapping(
        'ACCESSORIAL_CHARGE',
        data.accessorialCharges,
        mappingConfigs.accessorialCharges || null,
        companyId,
        mcNumberId,
        sourceSystem
      );
      summary.totalImported += results.accessorialCharges.created;
      summary.totalErrors += results.accessorialCharges.errors.length;
    }

    // 3. Invoices
    if (data.invoices) {
      results.invoices = await MigrationImportService.importWithMapping(
        'INVOICE',
        data.invoices,
        mappingConfigs.invoices || null,
        companyId,
        mcNumberId,
        sourceSystem
      );
      summary.totalImported += results.invoices.created;
      summary.totalErrors += results.invoices.errors.length;
      summary.financialTotals.invoices = results.invoices.created;
    }

    // 4. Invoice Batches (references invoices)
    if (data.invoiceBatches) {
      results.invoiceBatches = await MigrationImportService.importWithMapping(
        'INVOICE_BATCH',
        data.invoiceBatches,
        mappingConfigs.invoiceBatches || null,
        companyId,
        mcNumberId,
        sourceSystem
      );
      summary.totalImported += results.invoiceBatches.created;
      summary.totalErrors += results.invoiceBatches.errors.length;
    }

    // 5. Driver Advances (needed for settlements)
    if (data.driverAdvances) {
      results.driverAdvances = await MigrationImportService.importWithMapping(
        'DRIVER_ADVANCE',
        data.driverAdvances,
        mappingConfigs.driverAdvances || null,
        companyId,
        mcNumberId,
        sourceSystem
      );
      summary.totalImported += results.driverAdvances.created;
      summary.totalErrors += results.driverAdvances.errors.length;
    }

    // 6. Load Expenses (needed for settlements)
    if (data.loadExpenses) {
      results.loadExpenses = await MigrationImportService.importWithMapping(
        'LOAD_EXPENSE',
        data.loadExpenses,
        mappingConfigs.loadExpenses || null,
        companyId,
        mcNumberId,
        sourceSystem
      );
      summary.totalImported += results.loadExpenses.created;
      summary.totalErrors += results.loadExpenses.errors.length;
    }

    // 7. Settlements (references advances and expenses)
    if (data.settlements) {
      results.settlements = await MigrationImportService.importWithMapping(
        'SETTLEMENT',
        data.settlements,
        mappingConfigs.settlements || null,
        companyId,
        mcNumberId,
        sourceSystem
      );
      summary.totalImported += results.settlements.created;
      summary.totalErrors += results.settlements.errors.length;
      summary.financialTotals.settlements = results.settlements.created;
    }

    // 8. Payments (references invoices)
    if (data.payments) {
      results.payments = await MigrationImportService.importWithMapping(
        'PAYMENT',
        data.payments,
        mappingConfigs.payments || null,
        companyId,
        mcNumberId,
        sourceSystem
      );
      summary.totalImported += results.payments.created;
      summary.totalErrors += results.payments.errors.length;
      summary.financialTotals.payments = results.payments.created;
    }

    // 9. Reconciliations (references invoices and payments)
    if (data.reconciliations) {
      results.reconciliations = await MigrationImportService.importWithMapping(
        'RECONCILIATION',
        data.reconciliations,
        mappingConfigs.reconciliations || null,
        companyId,
        mcNumberId,
        sourceSystem
      );
      summary.totalImported += results.reconciliations.created;
      summary.totalErrors += results.reconciliations.errors.length;
    }

    return { results, summary };
  }

  /**
   * Validate financial data integrity
   */
  static async validateFinancialData(
    entityType: EntityType,
    data: Record<string, any>
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate based on entity type
    switch (entityType) {
      case 'INVOICE':
        if (!data.total || data.total <= 0) {
          errors.push('Invoice total must be greater than 0');
        }
        if (data.amountPaid && data.amountPaid > data.total) {
          warnings.push('Amount paid exceeds invoice total');
        }
        break;

      case 'SETTLEMENT':
        if (!data.grossPay || data.grossPay <= 0) {
          errors.push('Settlement gross pay must be greater than 0');
        }
        if (data.netPay && data.netPay < 0) {
          warnings.push('Settlement net pay is negative');
        }
        break;

      case 'PAYMENT':
        if (!data.amount || data.amount <= 0) {
          errors.push('Payment amount must be greater than 0');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Preserve financial audit trail
   */
  static async preserveAuditTrail(
    entityType: EntityType,
    entityId: string,
    sourceData: Record<string, any>
  ): Promise<void> {
    // Store audit information in metadata
    const auditData = {
      sourceSystem: sourceData.sourceSystem || 'ThirdPartyTMS',
      sourceId: sourceData.id || sourceData[`${entityType.toLowerCase()}_id`],
      originalAmount: sourceData.amount || sourceData.total || sourceData.grossPay,
      originalCurrency: sourceData.currency || 'USD',
      migratedAt: new Date().toISOString(),
    };

    const modelMap: Record<EntityType, string> = {
      INVOICE: 'invoice',
      SETTLEMENT: 'settlement',
      PAYMENT: 'payment',
      // Add other entity types as needed
    } as Record<EntityType, string>;

    const modelName = modelMap[entityType];
    if (modelName) {
      await (prisma as any)[modelName].update({
        where: { id: entityId },
        data: {
          metadata: {
            ...auditData,
            ...((await (prisma as any)[modelName].findUnique({
              where: { id: entityId },
              select: { metadata: true },
            }))?.metadata || {}),
          },
        },
      });
    }
  }
}









