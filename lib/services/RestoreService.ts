/**
 * Service for restoring soft-deleted records
 * Handles restoration of all entity types with deletedAt field
 */

import { prisma } from '@/lib/prisma';

// Entity type definitions with their display names and key fields
const ENTITY_CONFIG: Record<string, {
  model: string;
  displayName: string;
  fields: string[];
  nameField?: string;
}> = {
  truck: {
    model: 'truck',
    displayName: 'Trucks',
    fields: ['id', 'truckNumber', 'vin', 'make', 'model', 'year', 'deletedAt', 'samsaraId'],
    nameField: 'truckNumber',
  },
  trailer: {
    model: 'trailer',
    displayName: 'Trailers',
    fields: ['id', 'trailerNumber', 'vin', 'make', 'model', 'year', 'deletedAt', 'samsaraId'],
    nameField: 'trailerNumber',
  },
  driver: {
    model: 'driver',
    displayName: 'Drivers',
    fields: ['id', 'firstName', 'lastName', 'email', 'phone', 'deletedAt'],
    nameField: 'firstName',
  },
  load: {
    model: 'load',
    displayName: 'Loads',
    fields: ['id', 'loadNumber', 'status', 'customerRate', 'pickupCity', 'deliveryCity', 'deletedAt', 'createdAt'],
    nameField: 'loadNumber',
  },
  invoice: {
    model: 'invoice',
    displayName: 'Invoices',
    fields: ['id', 'invoiceNumber', 'status', 'total', 'totalAmount', 'dueDate', 'deletedAt', 'createdAt'],
    nameField: 'invoiceNumber',
  },
  customer: {
    model: 'customer',
    displayName: 'Customers',
    fields: ['id', 'name', 'email', 'phone', 'city', 'state', 'deletedAt'],
    nameField: 'name',
  },
  user: {
    model: 'user',
    displayName: 'Users',
    fields: ['id', 'firstName', 'lastName', 'email', 'role', 'deletedAt', 'lastLogin'],
    nameField: 'firstName',
  },
  document: {
    model: 'document',
    displayName: 'Documents',
    fields: ['id', 'title', 'type', 'fileName', 'deletedAt', 'createdAt'],
    nameField: 'title',
  },
  tag: {
    model: 'tag',
    displayName: 'Tags',
    fields: ['id', 'name', 'color', 'category', 'deletedAt'],
    nameField: 'name',
  },
  mcNumber: {
    model: 'mcNumber',
    displayName: 'MC Numbers',
    fields: ['id', 'number', 'name', 'status', 'deletedAt'],
    nameField: 'number',
  },
  accident: {
    model: 'safetyIncident',
    displayName: 'Accidents',
    fields: ['id', 'incidentNumber', 'date', 'location', 'severity', 'deletedAt'],
    nameField: 'incidentNumber',
  },
  insurancePolicy: {
    model: 'insurancePolicy',
    displayName: 'Insurance Policies',
    fields: ['id', 'policyNumber', 'type', 'provider', 'expirationDate', 'deletedAt'],
    nameField: 'policyNumber',
  },
};

export class RestoreService {
  /**
   * Get list of available entity types
   */
  getEntityTypes(): Array<{ type: string; displayName: string }> {
    return Object.entries(ENTITY_CONFIG).map(([type, config]) => ({
      type,
      displayName: config.displayName,
    }));
  }

  /**
   * Restore any soft-deleted item
   */
  async restoreItem(
    entityType: string,
    entityId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const config = ENTITY_CONFIG[entityType];
      if (!config) {
        return { success: false, error: `Unknown entity type: ${entityType}` };
      }

      // @ts-ignore - Dynamic model access
      const model = prisma[config.model];
      if (!model) {
        return { success: false, error: `Model not found: ${config.model}` };
      }

      const item = await model.findUnique({
        where: { id: entityId },
        select: { id: true, deletedAt: true },
      });

      if (!item) {
        return { success: false, error: `${config.displayName.slice(0, -1)} not found` };
      }

      if (!item.deletedAt) {
        return { success: false, error: `${config.displayName.slice(0, -1)} is not deleted` };
      }

      await model.update({
        where: { id: entityId },
        data: { deletedAt: null },
      });

      console.log(`[RestoreService] Restored ${entityType} ${entityId} by user ${userId}`);
      return { success: true };
    } catch (error: any) {
      console.error(`[RestoreService] Error restoring ${entityType}:`, error);
      return { success: false, error: error.message || `Failed to restore ${entityType}` };
    }
  }

  /**
   * Bulk restore multiple items
   */
  async bulkRestoreItems(
    entityType: string,
    entityIds: string[],
    userId: string
  ): Promise<{ restored: number; failed: number; errors: string[] }> {
    const results = { restored: 0, failed: 0, errors: [] as string[] };

    for (const entityId of entityIds) {
      const result = await this.restoreItem(entityType, entityId, userId);
      if (result.success) {
        results.restored++;
      } else {
        results.failed++;
        results.errors.push(`${entityId}: ${result.error}`);
      }
    }

    console.log(`[RestoreService] Bulk restore: ${results.restored} restored, ${results.failed} failed`);
    return results;
  }

  /**
   * Hard delete (permanently remove) a soft-deleted item
   * WARNING: This permanently deletes data from the database!
   */
  async hardDeleteItem(
    entityType: string,
    entityId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const config = ENTITY_CONFIG[entityType];
      if (!config) {
        return { success: false, error: `Unknown entity type: ${entityType}` };
      }

      // @ts-ignore - Dynamic model access
      const model = prisma[config.model];
      if (!model) {
        return { success: false, error: `Model not found: ${config.model}` };
      }

      const item = await model.findUnique({
        where: { id: entityId },
        select: { id: true, deletedAt: true },
      });

      if (!item) {
        return { success: false, error: `${config.displayName.slice(0, -1)} not found` };
      }

      if (!item.deletedAt) {
        return { success: false, error: `Cannot hard delete: ${config.displayName.slice(0, -1)} is not deleted. Only soft-deleted items can be permanently deleted.` };
      }

      // Permanent deletion
      await model.delete({
        where: { id: entityId },
      });

      console.log(`[RestoreService] HARD DELETED ${entityType} ${entityId} by user ${userId}`);
      return { success: true };
    } catch (error: any) {
      console.error(`[RestoreService] Error hard deleting ${entityType}:`, error);
      return { success: false, error: error.message || `Failed to hard delete ${entityType}` };
    }
  }

  /**
   * Bulk hard delete multiple items
   * WARNING: This permanently deletes data from the database!
   */
  async bulkHardDeleteItems(
    entityType: string,
    entityIds: string[],
    userId: string
  ): Promise<{ deleted: number; failed: number; errors: string[] }> {
    const results = { deleted: 0, failed: 0, errors: [] as string[] };

    for (const entityId of entityIds) {
      const result = await this.hardDeleteItem(entityType, entityId, userId);
      if (result.success) {
        results.deleted++;
      } else {
        results.failed++;
        results.errors.push(`${entityId}: ${result.error}`);
      }
    }

    console.log(`[RestoreService] Bulk hard delete: ${results.deleted} deleted, ${results.failed} failed`);
    return results;
  }

  /**
   * Get deleted items for a specific entity type
   */
  async getDeletedItems(companyId: string, entityType: string): Promise<any[]> {
    const config = ENTITY_CONFIG[entityType];
    if (!config) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    // @ts-ignore - Dynamic model access
    const model = prisma[config.model];
    if (!model) {
      throw new Error(`Model not found: ${config.model}`);
    }

    // Build select object from fields
    const select: Record<string, boolean> = {};
    config.fields.forEach(field => {
      select[field] = true;
    });

    // Some models don't have companyId (User has companyId but we filter by company for all)
    const modelsWithCompanyId = ['truck', 'trailer', 'driver', 'load', 'invoice', 'customer', 'user', 'document', 'tag', 'mcNumber', 'accident', 'insurancePolicy'];
    
    const where: any = {
      deletedAt: { not: null },
    };

    if (modelsWithCompanyId.includes(entityType)) {
      where.companyId = companyId;
    }

    try {
      return await model.findMany({
        where,
        select,
        orderBy: { deletedAt: 'desc' },
        take: 100, // Limit to 100 items per type
      });
    } catch (error: any) {
      console.error(`[RestoreService] Error fetching deleted ${entityType}:`, error.message || error);
      // If it's a field error, try with minimal fields
      if (error.message?.includes('Unknown field') || error.code === 'P2009') {
        console.log(`[RestoreService] Retrying ${entityType} with minimal fields...`);
        try {
          return await model.findMany({
            where,
            select: { id: true, deletedAt: true },
            orderBy: { deletedAt: 'desc' },
            take: 100,
          });
        } catch (retryError: any) {
          console.error(`[RestoreService] Retry failed for ${entityType}:`, retryError.message || retryError);
          return [];
        }
      }
      return [];
    }
  }

  /**
   * Get summary of deleted items
   */
  async getDeletedItemsSummary(companyId: string) {
    const counts: Record<string, number> = {};
    let total = 0;

    for (const [type, config] of Object.entries(ENTITY_CONFIG)) {
      try {
        // @ts-ignore - Dynamic model access
        const model = prisma[config.model];
        if (!model) continue;

        const modelsWithCompanyId = ['truck', 'trailer', 'driver', 'load', 'invoice', 'customer', 'user', 'document', 'tag', 'mcNumber', 'accident', 'insurancePolicy'];
        
        const where: any = {
          deletedAt: { not: null },
        };

        if (modelsWithCompanyId.includes(type)) {
          where.companyId = companyId;
        }

        const count = await model.count({ where });
        counts[type] = count;
        total += count;
      } catch (error: any) {
        // Model might not exist or have different structure
        console.error(`[RestoreService] Error counting deleted ${type}:`, error.message || error);
        counts[type] = 0;
      }
    }

    return { ...counts, total };
  }

  // Legacy methods for backward compatibility
  async restoreTruck(truckId: string, userId: string) {
    return this.restoreItem('truck', truckId, userId);
  }

  async restoreTrailer(trailerId: string, userId: string) {
    return this.restoreItem('trailer', trailerId, userId);
  }

  async restoreDriver(driverId: string, userId: string) {
    return this.restoreItem('driver', driverId, userId);
  }

  async getDeletedTrucks(companyId: string) {
    return this.getDeletedItems(companyId, 'truck');
  }

  async getDeletedTrailers(companyId: string) {
    return this.getDeletedItems(companyId, 'trailer');
  }

  async getDeletedDrivers(companyId: string) {
    return this.getDeletedItems(companyId, 'driver');
  }
}
