/**
 * AccountingSyncManager
 * 
 * Manages synchronization of completed loads to the accounting module.
 * Ensures data consistency across departments and handles sync failures.
 */

import { prisma } from '@/lib/prisma';

interface SyncResult {
  success: boolean;
  loadId: string;
  syncedAt?: Date;
  errors?: string[];
  retryCount?: number;
}

interface AccountingData {
  loadId: string;
  revenue: number;
  driverPay: number;
  totalExpenses: number;
  netProfit: number;
  fuelAdvances: number;
  accessorialCharges: number;
  readyForInvoicing: boolean;
  readyForSettlement: boolean;
}

export class AccountingSyncManager {
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds

  /**
   * Sync a single load to accounting
   */
  async syncLoadToAccounting(loadId: string): Promise<SyncResult> {
    try {
      // Fetch complete load data
      const load = await prisma.load.findUnique({
        where: { id: loadId },
        include: {
          loadExpenses: {
            where: {
              approvalStatus: 'APPROVED',
            },
          },
          driverAdvances: {
            where: {
              approvalStatus: 'APPROVED',
              deductedAt: null,
            },
          },
          accessorialCharges: {
            where: {
              status: 'APPROVED',
            },
          },
        },
      });

      if (!load) {
        return {
          success: false,
          loadId,
          errors: ['Load not found'],
        };
      }

      // Validate accounting data
      const validation = await this.validateAccountingData(load);
      if (!validation.isValid) {
        return {
          success: false,
          loadId,
          errors: validation.errors,
        };
      }

      // Calculate totals
      const totalExpenses = load.loadExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );
      const totalAccessorialCharges = load.accessorialCharges.reduce(
        (sum, charge) => sum + charge.amount,
        0
      );
      const adjustedRevenue = load.revenue + totalAccessorialCharges;
      const netProfit =
        adjustedRevenue - (load.driverPay || 0) - totalExpenses;

      // Update load with calculated values
      await prisma.load.update({
        where: { id: loadId },
        data: {
          totalExpenses,
          netProfit,
          accountingSyncedAt: new Date(),
          accountingSyncStatus: 'SYNCED',
        },
      });

      // Create activity log
      await prisma.activityLog.create({
        data: {
          companyId: load.companyId,
          action: 'ACCOUNTING_SYNC',
          entityType: 'Load',
          entityId: loadId,
          description: `Load ${load.loadNumber} synced to accounting`,
          metadata: {
            revenue: adjustedRevenue,
            driverPay: load.driverPay,
            totalExpenses,
            netProfit,
          },
        },
      });

      return {
        success: true,
        loadId,
        syncedAt: new Date(),
      };
    } catch (error: any) {
      return await this.handleSyncFailure(loadId, error);
    }
  }

  /**
   * Batch sync multiple loads
   */
  async syncBatchLoads(loadIds: string[]): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const loadId of loadIds) {
      const result = await this.syncLoadToAccounting(loadId);
      results.push(result);

      // Small delay between syncs to avoid overwhelming the database
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Validate accounting data before sync
   */
  async validateAccountingData(load: any): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check required fields
    if (!load.revenue || load.revenue === 0) {
      errors.push('Revenue is required');
    }

    if (load.status !== 'DELIVERED' && load.status !== 'INVOICED') {
      errors.push('Load must be delivered before syncing to accounting');
    }

    if (!load.deliveredAt) {
      errors.push('Delivery date is required');
    }

    // Validate driver pay if driver assigned
    if (load.driverId && (!load.driverPay || load.driverPay === 0)) {
      errors.push('Driver pay must be calculated for assigned loads');
    }

    // Check for pending expenses that need approval
    const pendingExpenses = await prisma.loadExpense.count({
      where: {
        loadId: load.id,
        approvalStatus: 'PENDING',
      },
    });

    if (pendingExpenses > 0) {
      errors.push(
        `${pendingExpenses} expense(s) pending approval. Approve or reject before syncing.`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Handle sync failures with retry logic
   */
  async handleSyncFailure(
    loadId: string,
    error: Error,
    retryCount: number = 0
  ): Promise<SyncResult> {
    // Update load status to failed
    await prisma.load.update({
      where: { id: loadId },
      data: {
        accountingSyncStatus: 'SYNC_FAILED',
      },
    });

    // Log the error
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: { companyId: true, loadNumber: true },
    });

    if (load) {
      await prisma.activityLog.create({
        data: {
          companyId: load.companyId,
          action: 'ACCOUNTING_SYNC_FAILED',
          entityType: 'Load',
          entityId: loadId,
          description: `Failed to sync load ${load.loadNumber} to accounting`,
          metadata: {
            error: error.message,
            retryCount,
          },
        },
      });
    }

    // Retry logic
    if (retryCount < this.maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
      return await this.syncLoadToAccounting(loadId);
    }

    return {
      success: false,
      loadId,
      errors: [error.message],
      retryCount,
    };
  }

  /**
   * Get loads pending accounting sync
   */
  async getLoadsPendingSync(companyId: string): Promise<any[]> {
    return await prisma.load.findMany({
      where: {
        companyId,
        status: {
          in: ['DELIVERED', 'INVOICED'],
        },
        accountingSyncStatus: {
          in: ['NOT_SYNCED', 'SYNC_FAILED'],
        },
        deletedAt: null,
      },
      include: {
        driver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        deliveredAt: 'asc',
      },
    });
  }

  /**
   * Retry failed syncs
   */
  async retryFailedSyncs(companyId: string): Promise<SyncResult[]> {
    const failedLoads = await prisma.load.findMany({
      where: {
        companyId,
        accountingSyncStatus: 'SYNC_FAILED',
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    return await this.syncBatchLoads(failedLoads.map((l) => l.id));
  }

  /**
   * Get accounting sync statistics
   */
  async getSyncStatistics(companyId: string): Promise<{
    total: number;
    synced: number;
    pending: number;
    failed: number;
    requiresReview: number;
  }> {
    const [total, synced, pending, failed, requiresReview] = await Promise.all([
      prisma.load.count({
        where: {
          companyId,
          status: {
            in: ['DELIVERED', 'INVOICED', 'PAID'],
          },
          deletedAt: null,
        },
      }),
      prisma.load.count({
        where: {
          companyId,
          accountingSyncStatus: 'SYNCED',
          deletedAt: null,
        },
      }),
      prisma.load.count({
        where: {
          companyId,
          accountingSyncStatus: {
            in: ['NOT_SYNCED', 'PENDING_SYNC'],
          },
          deletedAt: null,
        },
      }),
      prisma.load.count({
        where: {
          companyId,
          accountingSyncStatus: 'SYNC_FAILED',
          deletedAt: null,
        },
      }),
      prisma.load.count({
        where: {
          companyId,
          accountingSyncStatus: 'REQUIRES_REVIEW',
          deletedAt: null,
        },
      }),
    ]);

    return {
      total,
      synced,
      pending,
      failed,
      requiresReview,
    };
  }
}





