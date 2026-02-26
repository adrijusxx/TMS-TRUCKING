/**
 * ConsolidatedBillingManager
 *
 * Handles consolidated billing cycles for customers configured with
 * WEEKLY, BIWEEKLY, or MONTHLY billing. Customers with ON_DELIVERY
 * billing are invoiced immediately per load (default behavior).
 */

import { prisma } from '@/lib/prisma';
import { BillingCycle, LoadStatus } from '@prisma/client';
import { logger } from '@/lib/utils/logger';

interface BillingPeriod {
  start: Date;
  end: Date;
}

interface ConsolidatedBillingCustomer {
  id: string;
  name: string;
  billingCycle: BillingCycle;
  billingCycleDay: number | null;
  consolidatedBilling: boolean;
}

interface ConsolidatedLoadGroup {
  customer: ConsolidatedBillingCustomer;
  loadIds: string[];
  loadCount: number;
  totalRevenue: number;
  periodStart: Date;
  periodEnd: Date;
}

export class ConsolidatedBillingManager {
  /**
   * Get billing period dates based on customer's billing cycle.
   * Returns the most recently completed billing period.
   */
  static getBillingPeriod(cycle: BillingCycle, cycleDay: number | null, now = new Date()): BillingPeriod {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    switch (cycle) {
      case 'WEEKLY': {
        // cycleDay = 1 (Mon) to 7 (Sun), default Monday
        const targetDay = cycleDay ?? 1;
        const currentDay = end.getDay() || 7; // Convert 0 (Sun) to 7
        const daysBack = currentDay >= targetDay ? currentDay - targetDay : 7 - (targetDay - currentDay);
        end.setDate(end.getDate() - daysBack);
        start.setTime(end.getTime());
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      }
      case 'BIWEEKLY': {
        const targetDay = cycleDay ?? 1;
        const currentDay = end.getDay() || 7;
        const daysBack = currentDay >= targetDay ? currentDay - targetDay : 7 - (targetDay - currentDay);
        end.setDate(end.getDate() - daysBack);
        start.setTime(end.getTime());
        start.setDate(start.getDate() - 14);
        start.setHours(0, 0, 0, 0);
        break;
      }
      case 'MONTHLY': {
        // cycleDay = day of month (1-28), default 1st
        const targetMonthDay = Math.min(cycleDay ?? 1, 28);
        // End = last cycle day, Start = one month before
        end.setDate(targetMonthDay);
        if (end > now) {
          end.setMonth(end.getMonth() - 1);
        }
        start.setTime(end.getTime());
        start.setMonth(start.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        break;
      }
      default:
        // ON_DELIVERY — no period, use today
        start.setDate(start.getDate() - 1);
    }

    return { start, end };
  }

  /**
   * Get customers that are due for consolidated billing.
   */
  static async getCustomersDueForBilling(companyId: string): Promise<ConsolidatedLoadGroup[]> {
    const customers = await prisma.customer.findMany({
      where: {
        companyId,
        consolidatedBilling: true,
        billingCycle: { not: 'ON_DELIVERY' },
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        billingCycle: true,
        billingCycleDay: true,
        consolidatedBilling: true,
      },
    });

    const groups: ConsolidatedLoadGroup[] = [];

    for (const customer of customers) {
      const period = this.getBillingPeriod(customer.billingCycle, customer.billingCycleDay);

      const loads = await prisma.load.findMany({
        where: {
          companyId,
          customerId: customer.id,
          status: LoadStatus.DELIVERED,
          invoicedAt: null,
          isBillingHold: false,
          deletedAt: null,
          revenue: { gt: 0 },
          deliveryDate: {
            gte: period.start,
            lte: period.end,
          },
        },
        select: {
          id: true,
          revenue: true,
        },
      });

      if (loads.length === 0) continue;

      groups.push({
        customer,
        loadIds: loads.map((l) => l.id),
        loadCount: loads.length,
        totalRevenue: loads.reduce((sum, l) => sum + (l.revenue || 0), 0),
        periodStart: period.start,
        periodEnd: period.end,
      });
    }

    return groups;
  }

  /**
   * Get loads for a specific customer's billing period.
   */
  static async getLoadsForBillingPeriod(
    customerId: string,
    periodStart: Date,
    periodEnd: Date
  ) {
    return prisma.load.findMany({
      where: {
        customerId,
        status: LoadStatus.DELIVERED,
        invoicedAt: null,
        isBillingHold: false,
        deletedAt: null,
        revenue: { gt: 0 },
        deliveryDate: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        id: true,
        loadNumber: true,
        revenue: true,
        deliveryDate: true,
      },
      orderBy: { deliveryDate: 'asc' },
    });
  }

  /**
   * Check if a customer should skip immediate invoicing (consolidated billing).
   * Returns true if the customer uses consolidated billing and the current
   * date is NOT on their billing cycle day.
   */
  static shouldDeferInvoicing(customer: {
    billingCycle: BillingCycle;
    consolidatedBilling: boolean;
    billingCycleDay: number | null;
  }): boolean {
    if (!customer.consolidatedBilling || customer.billingCycle === 'ON_DELIVERY') {
      return false;
    }
    // Consolidated billing customers are always deferred — they get invoiced
    // by the scheduled billing run, not per-delivery
    return true;
  }
}
