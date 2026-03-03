/**
 * CustomerCreditManager
 *
 * Manages customer credit limits, DSO calculations, and credit holds.
 * Integrates with dispatch to warn when customers approach credit limits.
 */

import { prisma } from '@/lib/prisma';
import { InvoiceStatus } from '@prisma/client';
import { logger } from '@/lib/utils/logger';
import { NotFoundError } from '@/lib/errors';

interface CreditCheckResult {
  withinLimit: boolean;
  currentBalance: number;
  creditLimit: number | null;
  percentUsed: number;
  isOnHold: boolean;
  holdReason: string | null;
}

export class CustomerCreditManager {
  /**
   * Check a customer's credit status against their limit.
   */
  static async checkCreditLimit(customerId: string): Promise<CreditCheckResult> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        creditLimit: true,
        creditHold: true,
        creditHoldReason: true,
        creditAlertThreshold: true,
      },
    });

    if (!customer) throw new NotFoundError('Customer', customerId);

    // Sum all unpaid invoice balances
    const agg = await prisma.invoice.aggregate({
      where: {
        customerId,
        status: { in: [InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] },
        balance: { gt: 0 },
      },
      _sum: { balance: true },
    });

    const currentBalance = agg._sum?.balance || 0;
    const creditLimit = customer.creditLimit;
    const percentUsed = creditLimit && creditLimit > 0 ? (currentBalance / creditLimit) * 100 : 0;

    return {
      withinLimit: !creditLimit || currentBalance <= creditLimit,
      currentBalance,
      creditLimit,
      percentUsed,
      isOnHold: customer.creditHold,
      holdReason: customer.creditHoldReason,
    };
  }

  /**
   * Calculate Days Sales Outstanding (DSO) for a customer.
   * DSO = (Accounts Receivable / Total Credit Sales) * Number of Days
   */
  static async calculateDSO(customerId: string, periodMonths = 3): Promise<number> {
    const periodStart = new Date();
    periodStart.setMonth(periodStart.getMonth() - periodMonths);

    const [receivable, totalSales] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          customerId,
          status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] },
          balance: { gt: 0 },
        },
        _sum: { balance: true },
      }),
      prisma.invoice.aggregate({
        where: {
          customerId,
          invoiceDate: { gte: periodStart },
        },
        _sum: { total: true },
      }),
    ]);

    const ar = receivable._sum?.balance || 0;
    const sales = totalSales._sum?.total || 0;
    const days = periodMonths * 30;

    if (sales === 0) return 0;
    return Number(((ar / sales) * days).toFixed(1));
  }

  /**
   * Place a customer on credit hold.
   */
  static async setCreditHold(customerId: string, reason: string, userId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { companyId: true, name: true },
    });

    if (!customer) throw new NotFoundError('Customer', customerId);

    const [updated] = await prisma.$transaction([
      prisma.customer.update({
        where: { id: customerId },
        data: {
          creditHold: true,
          creditHoldReason: reason,
          creditHoldDate: new Date(),
        },
      }),
      prisma.activityLog.create({
        data: {
          companyId: customer.companyId,
          userId,
          action: 'CREDIT_HOLD_SET',
          entityType: 'Customer',
          entityId: customerId,
          description: `Credit hold placed on ${customer.name}: ${reason}`,
          metadata: { reason },
        },
      }),
    ]);

    logger.info('Credit hold set', { customerId, reason, userId });
    return updated;
  }

  /**
   * Release a customer from credit hold.
   */
  static async releaseCreditHold(customerId: string, userId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { companyId: true, name: true },
    });

    if (!customer) throw new NotFoundError('Customer', customerId);

    const [updated] = await prisma.$transaction([
      prisma.customer.update({
        where: { id: customerId },
        data: {
          creditHold: false,
          creditHoldReason: null,
          creditHoldDate: null,
        },
      }),
      prisma.activityLog.create({
        data: {
          companyId: customer.companyId,
          userId,
          action: 'CREDIT_HOLD_RELEASED',
          entityType: 'Customer',
          entityId: customerId,
          description: `Credit hold released for ${customer.name}`,
        },
      }),
    ]);

    logger.info('Credit hold released', { customerId, userId });
    return updated;
  }
}
