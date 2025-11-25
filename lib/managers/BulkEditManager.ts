import { prisma } from '@/lib/prisma';
import type { BulkEditField } from '@/components/data-table/types';

/**
 * Manager for handling bulk edit operations
 */
export class BulkEditManager {
  /**
   * Validate bulk edit updates
   */
  static validateUpdates(
    fields: BulkEditField[],
    updates: Record<string, any>
  ): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = updates[field.key];

      // Skip if value not provided
      if (value === undefined || value === null || value === '') {
        if (field.required) {
          errors[field.key] = `${field.label} is required`;
        }
        return;
      }

      // Run custom validation
      if (field.validate) {
        const error = field.validate(value);
        if (error) {
          errors[field.key] = error;
        }
      }
    });

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Apply bulk updates to records
   */
  static async applyBulkUpdates(
    entityType: string,
    ids: string[],
    updates: Record<string, any>,
    companyId: string
  ): Promise<{ updatedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let updatedCount = 0;

    try {
      // Map entity types to Prisma models
      const entityModelMap: Record<string, any> = {
        trucks: prisma.truck,
        trailers: prisma.trailer,
        loads: prisma.load,
        drivers: prisma.driver,
        customers: prisma.customer,
        invoices: prisma.invoice,
        breakdowns: prisma.breakdown,
        maintenance: prisma.maintenanceRecord,
        inspections: prisma.inspection,
        vendors: prisma.vendor,
        locations: prisma.location,
      };

      const model = entityModelMap[entityType];

      if (!model) {
        throw new Error(`Unknown entity type: ${entityType}`);
      }

      // Update records in batches
      const batchSize = 100;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);

        try {
          const result = await model.updateMany({
            where: {
              id: { in: batch },
              companyId,
              deletedAt: null,
            },
            data: {
              ...updates,
              updatedAt: new Date(),
            },
          });

          updatedCount += result.count;
        } catch (error: any) {
          errors.push(`Failed to update batch: ${error.message}`);
        }
      }

      return { updatedCount, errors };
    } catch (error: any) {
      throw new Error(`Bulk update failed: ${error.message}`);
    }
  }
}

