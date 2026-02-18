/**
 * LoadCompletionManager
 * 
 * Orchestrates all post-completion workflows when a load is delivered.
 * Triggers cross-departmental syncs and updates.
 */

import { prisma } from '@/lib/prisma';
import { AccountingSyncManager } from './AccountingSyncManager';
import { LoadCostingManager } from './LoadCostingManager';
import { InvoiceManager } from './InvoiceManager';
import { BillingHoldManager } from './BillingHoldManager';
// import { notifyLoadCompleted } from '@/lib/notifications/triggers'; // TODO: Implement notification trigger

interface LoadCompletionResult {
  success: boolean;
  loadId: string;
  syncedToAccounting: boolean;
  metricsUpdated: boolean;
  notificationsSent: boolean;
  errors?: string[];
}

interface LoadValidationResult {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
}

export class LoadCompletionManager {
  private accountingSyncManager: AccountingSyncManager;
  private costingManager: LoadCostingManager;
  private invoiceManager: InvoiceManager;
  private billingHoldManager: BillingHoldManager;

  constructor() {
    this.accountingSyncManager = new AccountingSyncManager();
    this.costingManager = new LoadCostingManager();
    this.invoiceManager = new InvoiceManager();
    this.billingHoldManager = new BillingHoldManager();
  }

  /**
   * Main orchestrator for load completion workflow
   * Triggers when load status changes to DELIVERED or POD is uploaded
   */
  async handleLoadCompletion(loadId: string): Promise<LoadCompletionResult> {
    const errors: string[] = [];
    let syncedToAccounting = false;
    let metricsUpdated = false;
    let notificationsSent = false;

    try {
      // 1. Fetch load with all necessary relations
      const load = await prisma.load.findUnique({
        where: { id: loadId },
        include: {
          driver: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          truck: true,
          trailer: true,
          customer: true,
          loadExpenses: true,
          driverAdvances: true,
          accessorialCharges: true,
        },
      });

      if (!load) {
        return {
          success: false,
          loadId,
          syncedToAccounting: false,
          metricsUpdated: false,
          notificationsSent: false,
          errors: ['Load not found'],
        };
      }

      // 1b. Mark load as ready for settlement FIRST (before other steps that might fail)
      if (load.driverId) {
        await prisma.load.update({
          where: { id: loadId },
          data: {
            readyForSettlement: true,
            deliveredAt: load.deliveredAt || new Date(),
          },
        });
      }

      // 2. Validate load data completeness
      const validation = await this.validateLoadData(load);
      if (!validation.isValid) {
        errors.push(`Validation failed: ${validation.missingFields.join(', ')}`);
        // Continue but mark as requiring review
        await prisma.load.update({
          where: { id: loadId },
          data: {
            accountingSyncStatus: 'REQUIRES_REVIEW',
          },
        });
      }

      // 3. Calculate final load costs and profitability
      try {
        await this.costingManager.calculateLoadCost(loadId);
        await this.costingManager.calculateProfitability(loadId);
      } catch (error: any) {
        errors.push(`Cost calculation failed: ${error.message}`);
      }

      // 4. Sync to accounting
      try {
        const syncResult = await this.accountingSyncManager.syncLoadToAccounting(loadId);
        syncedToAccounting = syncResult.success;
        if (!syncResult.success) {
          errors.push(...(syncResult.errors || []));
        }
      } catch (error: any) {
        errors.push(`Accounting sync failed: ${error.message}`);
      }

      // 4b. Auto-Generate Invoice (if eligible)
      try {
        const eligibility = await this.billingHoldManager.checkInvoicingEligibility(loadId);
        if (eligibility.eligible) {
          const readyToBill = await this.invoiceManager.isReadyToBill(loadId, {
            allowBrokerageSplit: load.customer?.type === 'BROKER'
          });

          if (readyToBill.ready) {
            const invoiceResult = await this.invoiceManager.generateInvoice([loadId]);
            if (!invoiceResult.success) {
              errors.push(`Auto-invoice failed: ${invoiceResult.error}`);
            }
          }
        }
      } catch (error: any) {
        console.error('Auto-invoice error:', error);
        // Don't fail the whole completion flow for invoicing error, just log it
      }

      // 5. Update operations metrics
      try {
        await this.updateOperationsMetrics(load);
        metricsUpdated = true;
      } catch (error: any) {
        errors.push(`Metrics update failed: ${error.message}`);
      }

      // 6. Notify departments
      try {
        await this.notifyDepartments(load);
        notificationsSent = true;
      } catch (error: any) {
        errors.push(`Notifications failed: ${error.message}`);
      }

      return {
        success: errors.length === 0,
        loadId,
        syncedToAccounting,
        metricsUpdated,
        notificationsSent,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        loadId,
        syncedToAccounting,
        metricsUpdated,
        notificationsSent,
        errors: [error.message],
      };
    }
  }

  /**
   * Validate that load has all required data for accounting sync
   */
  async validateLoadData(load: any): Promise<LoadValidationResult> {
    const missingFields: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!load.deliveredAt) {
      missingFields.push('deliveredAt');
    }
    if (!load.revenue || load.revenue === 0) {
      missingFields.push('revenue');
    }
    if (!load.driverId) {
      warnings.push('No driver assigned');
    }
    if (!load.totalMiles || load.totalMiles === 0) {
      warnings.push('Total miles not recorded');
    }

    // Check for critical documents (BOL, POD) if required
    const bolDocument = await prisma.document.findFirst({
      where: {
        loadId: load.id,
        type: 'BOL',
      },
    });

    const podDocument = await prisma.document.findFirst({
      where: {
        loadId: load.id,
        type: 'POD',
      },
    });

    if (!bolDocument) {
      missingFields.push('BOL (Missing Document)');
    }

    if (!podDocument) {
      missingFields.push('POD (Missing Document)');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings,
    };
  }

  /**
   * Update operations metrics after load completion
   */
  private async updateOperationsMetrics(load: any): Promise<void> {
    // Update driver statistics
    if (load.driverId) {
      const driver = await prisma.driver.findUnique({
        where: { id: load.driverId },
      });

      if (driver) {
        await prisma.driver.update({
          where: { id: load.driverId },
          data: {
            totalLoads: { increment: 1 },
            totalMiles: {
              increment: load.totalMiles || 0,
            },
            // Update on-time percentage if applicable
            onTimePercentage: load.onTimeDelivery
              ? ((driver.totalLoads * driver.onTimePercentage + 100) /
                (driver.totalLoads + 1))
              : ((driver.totalLoads * driver.onTimePercentage) /
                (driver.totalLoads + 1)),
          },
        });
      }
    }

    // Update truck mileage for maintenance tracking
    if (load.truckId && load.totalMiles) {
      await prisma.truck.update({
        where: { id: load.truckId },
        data: {
          odometerReading: {
            increment: load.totalMiles,
          },
        },
      });
    }

    // Update customer statistics
    await prisma.customer.update({
      where: { id: load.customerId },
      data: {
        totalLoads: { increment: 1 },
        totalRevenue: {
          increment: load.revenue || 0,
        },
      },
    });
  }

  /**
   * Send notifications to relevant departments
   */
  private async notifyDepartments(load: any): Promise<void> {
    // Create activity log
    await prisma.activityLog.create({
      data: {
        companyId: load.companyId,
        action: 'LOAD_COMPLETED',
        entityType: 'Load',
        entityId: load.id,
        description: `Load ${load.loadNumber} completed and synced to accounting`,
        metadata: {
          revenue: load.revenue,
          driverPay: load.driverPay,
          totalExpenses: load.totalExpenses,
          netProfit: load.netProfit,
        },
      },
    });
  }

  /**
   * Handle POD upload trigger
   */
  async handlePODUpload(loadId: string, documentId: string): Promise<void> {
    await prisma.load.update({
      where: { id: loadId },
      data: {
        podUploadedAt: new Date(),
      },
    });

    // Trigger completion workflow if load is delivered
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: { status: true },
    });

    if (load?.status === 'DELIVERED') {
      await this.handleLoadCompletion(loadId);
    }
  }
}
