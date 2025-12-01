/**
 * BillingHoldManager
 * 
 * Manages billing hold status when Rate Con updates are required
 * due to accessorial charges (Lumper, Detention, etc.)
 * 
 * CRITICAL: Billing hold blocks Customer Invoicing (AR) but allows Driver Settlement (AP)
 */
import { prisma } from '@/lib/prisma';
import { notifyBillingHold } from '@/lib/notifications/triggers';
import { LoadStatus } from '@prisma/client';

interface BillingHoldResult {
  billingHoldSet: boolean;
  loadId?: string;
  loadNumber?: string;
  reason?: string;
  blocksInvoicing?: boolean;
  allowsSettlement?: boolean;
}

interface InvoicingEligibilityResult {
  eligible: boolean;
  reason?: string;
  isBillingHold?: boolean;
  loadStatus?: LoadStatus;
}

export class BillingHoldManager {
  
  /**
   * Apply billing hold to a load
   * 
   * Sets isBillingHold flag and billingHoldReason
   * Blocks invoicing (AR) but does NOT block settlement (AP)
   */
  async applyBillingHold(
    loadId: string,
    reason: string,
    accessorialChargeId?: string
  ): Promise<BillingHoldResult> {
    try {
      // Fetch load to get loadNumber for notifications
      const load = await prisma.load.findUnique({
        where: { id: loadId },
        select: {
          id: true,
          loadNumber: true,
          companyId: true,
          status: true,
          customer: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!load) {
        return {
          billingHoldSet: false,
          reason: 'Load not found',
        };
      }

      // Set billing hold flag (blocks invoicing, allows settlement)
      await prisma.load.update({
        where: { id: loadId },
        data: {
          isBillingHold: true,
          billingHoldReason: reason,
          accountingSyncStatus: 'REQUIRES_REVIEW',
          dispatchNotes: `BILLING HOLD (AR): ${reason} - Rate Con update required before invoicing.\n` +
                        `NOTE: Driver settlement (AP) can proceed independently.\n` +
                        `${new Date().toISOString()}`,
        },
      });

      // Notify accounting department (AR team only)
      await notifyBillingHold({
        loadId,
        loadNumber: load.loadNumber,
        reason,
        accessorialChargeId: accessorialChargeId || '', // Will be set by caller if available
        requiresRateConUpdate: true,
        blocksInvoicing: true,
        allowsSettlement: true, // CRITICAL: Settlement can proceed
      });

      return {
        billingHoldSet: true,
        loadId,
        loadNumber: load.loadNumber,
        reason,
        blocksInvoicing: true,
        allowsSettlement: true,
      };
    } catch (error: any) {
      console.error('Error applying billing hold:', error);
      return {
        billingHoldSet: false,
        reason: error.message || 'Failed to apply billing hold',
      };
    }
  }

  /**
   * Check if load is eligible for invoicing
   * 
   * Returns FALSE if:
   * - isBillingHold === true
   * - status !== 'DELIVERED'
   * 
   * CRITICAL: This does NOT check settlement eligibility
   * Settlement (AP) can proceed independently
   */
  async checkInvoicingEligibility(loadId: string): Promise<InvoicingEligibilityResult> {
    try {
      const load = await prisma.load.findUnique({
        where: { id: loadId },
        select: {
          id: true,
          loadNumber: true,
          status: true,
          isBillingHold: true,
          billingHoldReason: true,
        },
      });

      if (!load) {
        return {
          eligible: false,
          reason: 'Load not found',
        };
      }

      // Check 1: Billing hold blocks invoicing
      if (load.isBillingHold) {
        return {
          eligible: false,
          reason: `Load is on billing hold: ${load.billingHoldReason || 'Rate Con update required'}`,
          isBillingHold: true,
          loadStatus: load.status,
        };
      }

      // Check 2: Status must be DELIVERED (or READY_TO_BILL)
      if (load.status !== 'DELIVERED' && load.status !== 'READY_TO_BILL') {
        return {
          eligible: false,
          reason: `Load status is ${load.status}. Load must be DELIVERED or READY_TO_BILL to create invoice.`,
          isBillingHold: false,
          loadStatus: load.status,
        };
      }

      return {
        eligible: true,
        isBillingHold: false,
        loadStatus: load.status,
      };
    } catch (error: any) {
      console.error('Error checking invoicing eligibility:', error);
      return {
        eligible: false,
        reason: error.message || 'Failed to check invoicing eligibility',
      };
    }
  }

  /**
   * Clear billing hold on a load
   * 
   * Called when Rate Con is updated with new total including accessorials
   */
  async clearBillingHold(
    loadId: string,
    context: {
      rateConfirmationId: string;
      updatedBy: string;
      newTotalRate: number;
    }
  ): Promise<{ cleared: boolean; reason?: string; newStatus?: string }> {
    try {
      const load = await prisma.load.findUnique({
        where: { id: loadId },
        include: {
          accessorialCharges: {
            where: {
              status: 'PENDING',
              chargeType: { in: ['LUMPER', 'DETENTION'] },
            },
          },
          rateConfirmation: true,
        },
      });

      if (!load || !load.isBillingHold) {
        return {
          cleared: false,
          reason: 'Load is not on billing hold',
        };
      }

      // Approve pending accessorial charges
      await prisma.accessorialCharge.updateMany({
        where: {
          loadId,
          status: 'PENDING',
          chargeType: { in: ['LUMPER', 'DETENTION'] },
        },
        data: {
          status: 'APPROVED',
          approvedById: context.updatedBy,
          approvedAt: new Date(),
        },
      });

      // Clear billing hold - move to READY_TO_BILL
      await prisma.load.update({
        where: { id: loadId },
        data: {
          isBillingHold: false,
          billingHoldReason: null,
          status: 'READY_TO_BILL',
          dispatchNotes: `Billing hold cleared: Rate Con updated to include accessorials. Total: $${context.newTotalRate}\n${new Date().toISOString()}`,
          accountingSyncStatus: 'PENDING_SYNC',
        },
      });

      return {
        cleared: true,
        newStatus: 'READY_TO_BILL',
      };
    } catch (error: any) {
      console.error('Error clearing billing hold:', error);
      return {
        cleared: false,
        reason: error.message || 'Failed to clear billing hold',
      };
    }
  }

  /**
   * Check if load requires billing hold based on charge type
   * 
   * Helper method to determine if a charge type requires Rate Con update
   */
  requiresBillingHold(chargeType: string): boolean {
    return ['LUMPER', 'DETENTION'].includes(chargeType);
  }
}

