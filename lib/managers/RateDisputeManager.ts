/**
 * RateDisputeManager
 *
 * Manages rate disputes on loads and invoices.
 * When a dispute is opened, the load is placed on billing hold.
 * Resolution can adjust revenue and create credit memos.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

export class RateDisputeManager {
  /**
   * Open a rate dispute on a load.
   * Sets billing hold to block invoicing until resolved.
   */
  static async openDispute(loadId: string, reason: string, userId: string) {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: { companyId: true, loadNumber: true },
    });

    if (!load) throw new Error('Load not found');

    const [updated] = await prisma.$transaction([
      prisma.load.update({
        where: { id: loadId },
        data: {
          isBillingHold: true,
          billingHoldReason: `Rate dispute: ${reason}`,
        },
      }),
      prisma.activityLog.create({
        data: {
          companyId: load.companyId,
          userId,
          action: 'RATE_DISPUTE_OPENED',
          entityType: 'Load',
          entityId: loadId,
          description: `Rate dispute opened on ${load.loadNumber}: ${reason}`,
          metadata: { reason },
        },
      }),
    ]);

    logger.info('Rate dispute opened', { loadId, reason });
    return updated;
  }

  /**
   * Resolve a rate dispute. Optionally adjusts revenue.
   */
  static async resolveDispute(
    loadId: string,
    resolution: string,
    userId: string,
    adjustedRevenue?: number
  ) {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: { companyId: true, loadNumber: true, revenue: true },
    });

    if (!load) throw new Error('Load not found');

    const updateData: Record<string, unknown> = {
      isBillingHold: false,
      billingHoldReason: null,
    };

    if (adjustedRevenue !== undefined && adjustedRevenue !== load.revenue) {
      updateData.revenue = adjustedRevenue;
    }

    const [updated] = await prisma.$transaction([
      prisma.load.update({
        where: { id: loadId },
        data: updateData,
      }),
      prisma.activityLog.create({
        data: {
          companyId: load.companyId,
          userId,
          action: 'RATE_DISPUTE_RESOLVED',
          entityType: 'Load',
          entityId: loadId,
          description: `Rate dispute resolved on ${load.loadNumber}: ${resolution}` +
            (adjustedRevenue !== undefined ? ` (revenue adjusted to $${adjustedRevenue})` : ''),
          metadata: {
            resolution,
            originalRevenue: load.revenue,
            adjustedRevenue,
          },
        },
      }),
    ]);

    logger.info('Rate dispute resolved', { loadId, resolution, adjustedRevenue });
    return updated;
  }

  /**
   * Apply a credit memo to an invoice (reduces balance).
   */
  static async applyCreditMemo(
    invoiceId: string,
    amount: number,
    reason: string,
    userId: string
  ) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { companyId: true, invoiceNumber: true, balance: true, total: true },
    });

    if (!invoice) throw new Error('Invoice not found');
    if (amount > (invoice.balance || 0)) throw new Error('Credit memo amount exceeds balance');

    const newBalance = (invoice.balance || 0) - amount;

    const [updated] = await prisma.$transaction([
      prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          balance: newBalance,
          shortPayAmount: { increment: amount },
          shortPayReason: reason,
          ...(newBalance <= 0 ? { status: 'PAID', paidDate: new Date() } : {}),
        },
      }),
      prisma.activityLog.create({
        data: {
          companyId: invoice.companyId,
          userId,
          action: 'CREDIT_MEMO_APPLIED',
          entityType: 'Invoice',
          entityId: invoiceId,
          description: `Credit memo of $${amount.toFixed(2)} applied to ${invoice.invoiceNumber}: ${reason}`,
          metadata: { amount, reason, originalBalance: invoice.balance, newBalance },
        },
      }),
    ]);

    logger.info('Credit memo applied', { invoiceId, amount, reason });
    return updated;
  }
}
