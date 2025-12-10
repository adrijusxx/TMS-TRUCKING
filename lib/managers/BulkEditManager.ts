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
        settlements: prisma.settlement,
        batches: prisma.invoiceBatch,
      };

      const model = entityModelMap[entityType];

      if (!model) {
        throw new Error(`Unknown entity type: ${entityType}`);
      }

      // Special handling for entities without direct companyId
      if (entityType === 'settlements') {
        // Settlements are linked through driver
        // Get all drivers for the company first
        const companyDrivers = await prisma.driver.findMany({
          where: { companyId, deletedAt: null },
          select: { id: true },
        });
        const driverIds = companyDrivers.map((d) => d.id);

        // Update records in batches
        const batchSize = 100;
        for (let i = 0; i < ids.length; i += batchSize) {
          const batch = ids.slice(i, i + batchSize);

          try {
            const result = await model.updateMany({
              where: {
                id: { in: batch },
                driverId: { in: driverIds }, // Filter through driver relationship
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
      } else if (entityType === 'invoices') {
        // Invoices are linked through customer
        // First, verify all invoices belong to customers in this company
        const validInvoices = await prisma.invoice.findMany({
          where: {
            id: { in: ids },
            customer: { companyId },
          },
          select: { id: true },
        });
        
        const validInvoiceIds = validInvoices.map((inv) => inv.id);
        
        if (validInvoiceIds.length === 0) {
          throw new Error('No valid invoices found for this company');
        }

        // Update records in batches
        const batchSize = 100;
        for (let i = 0; i < validInvoiceIds.length; i += batchSize) {
          const batch = validInvoiceIds.slice(i, i + batchSize);

          try {
            const result = await model.updateMany({
              where: {
                id: { in: batch },
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
      } else if (entityType === 'batches') {
        // Special handling for batches: convert mcNumberId to mcNumber string
        const processedUpdates = { ...updates };
        
        // If mcNumberId is provided, convert it to mcNumber string
        if (processedUpdates.mcNumberId !== undefined) {
          if (processedUpdates.mcNumberId === null || processedUpdates.mcNumberId === '') {
            // Clear MC number
            processedUpdates.mcNumber = null;
            console.log('[BulkEdit] Clearing MC number for batches');
          } else {
            // Fetch MC number string from ID
            const mcNumber = await prisma.mcNumber.findUnique({
              where: { id: processedUpdates.mcNumberId },
              select: { number: true },
            });
            
            if (mcNumber) {
              processedUpdates.mcNumber = mcNumber.number;
              console.log(`[BulkEdit] Converting mcNumberId ${processedUpdates.mcNumberId} to mcNumber ${mcNumber.number}`);
            } else {
              const errorMsg = `MC number with ID ${processedUpdates.mcNumberId} not found`;
              errors.push(errorMsg);
              console.error(`[BulkEdit] ${errorMsg}`);
              delete processedUpdates.mcNumberId;
            }
          }
          // Remove mcNumberId from updates (not a valid field for InvoiceBatch)
          delete processedUpdates.mcNumberId;
        }

        // Standard update for batches with direct companyId
        // Note: InvoiceBatch doesn't have deletedAt field
        const batchSize = 100;
        for (let i = 0; i < ids.length; i += batchSize) {
          const batch = ids.slice(i, i + batchSize);

          try {
            console.log(`[BulkEdit] Updating batches:`, { batch, processedUpdates });
            const result = await model.updateMany({
              where: {
                id: { in: batch },
                companyId,
                // InvoiceBatch doesn't have deletedAt field
              },
              data: {
                ...processedUpdates,
                updatedAt: new Date(),
              },
            });

            console.log(`[BulkEdit] Updated ${result.count} batch(es)`);
            updatedCount += result.count;
          } catch (error: any) {
            const errorMsg = `Failed to update batch: ${error.message}`;
            errors.push(errorMsg);
            console.error('[BulkEdit] Batch update error:', error);
          }
        }
      } else {
        // Standard update for entities with direct companyId
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
      }

      return { updatedCount, errors };
    } catch (error: any) {
      throw new Error(`Bulk update failed: ${error.message}`);
    }
  }
}

