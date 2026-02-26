import { prisma } from '@/lib/prisma';
import type { CommissionType, CommissionStatus } from '@prisma/client';

interface CalculateCommissionInput {
  companyId: string;
  dispatcherId: string;
  loadId: string;
  commissionType: CommissionType;
  percentage?: number;
  flatAmount?: number;
}

export class DispatcherPayManager {
  /** Calculate commission for a single load */
  static async calculateCommission(input: CalculateCommissionInput) {
    const load = await prisma.load.findUniqueOrThrow({
      where: { id: input.loadId },
      select: { id: true, revenue: true, loadNumber: true },
    });

    let amount = 0;
    if (input.commissionType === 'PERCENTAGE' && input.percentage) {
      amount = (load.revenue || 0) * (input.percentage / 100);
    } else if (input.commissionType === 'FLAT' && input.flatAmount) {
      amount = input.flatAmount;
    }

    return prisma.dispatcherCommission.create({
      data: {
        companyId: input.companyId,
        dispatcherId: input.dispatcherId,
        loadId: input.loadId,
        commissionType: input.commissionType,
        percentage: input.percentage,
        flatAmount: input.flatAmount,
        amount,
      },
      include: {
        load: { select: { loadNumber: true, revenue: true } },
        dispatcher: { select: { firstName: true, lastName: true } },
      },
    });
  }

  /** Generate commissions for all dispatchers in a period */
  static async generateBatchCommissions(
    companyId: string,
    periodStart: Date,
    periodEnd: Date,
    salaryBatchId?: string
  ) {
    // Find loads delivered in period that have a dispatcherId
    const loads = await prisma.load.findMany({
      where: {
        companyId,
        deletedAt: null,
        deliveredAt: { gte: periodStart, lte: periodEnd },
        dispatcherId: { not: null },
      },
      select: {
        id: true,
        dispatcherId: true,
        revenue: true,
        loadNumber: true,
      },
    });

    // Check which loads already have commissions
    const existingCommissions = await prisma.dispatcherCommission.findMany({
      where: {
        companyId,
        loadId: { in: loads.map((l) => l.id) },
      },
      select: { loadId: true },
    });
    const existingLoadIds = new Set(existingCommissions.map((c) => c.loadId));

    const newLoads = loads.filter((l) => !existingLoadIds.has(l.id));
    const results = [];

    for (const load of newLoads) {
      if (!load.dispatcherId) continue;

      // Default: 5% commission on revenue
      const amount = (load.revenue || 0) * 0.05;
      const commission = await prisma.dispatcherCommission.create({
        data: {
          companyId,
          dispatcherId: load.dispatcherId,
          loadId: load.id,
          commissionType: 'PERCENTAGE',
          percentage: 5,
          amount,
          salaryBatchId,
          periodStart,
          periodEnd,
        },
      });
      results.push(commission);
    }

    return {
      created: results.length,
      skipped: existingLoadIds.size,
      totalAmount: results.reduce((s, c) => s + c.amount, 0),
    };
  }

  /** Get dispatcher statement for a date range */
  static async getDispatcherStatement(
    dispatcherId: string,
    companyId: string,
    startDate: Date,
    endDate: Date
  ) {
    const commissions = await prisma.dispatcherCommission.findMany({
      where: {
        dispatcherId,
        companyId,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        load: { select: { loadNumber: true, revenue: true, deliveredAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalAmount = commissions.reduce((s, c) => s + c.amount, 0);
    const pendingAmount = commissions
      .filter((c) => c.status === 'PENDING')
      .reduce((s, c) => s + c.amount, 0);
    const paidAmount = commissions
      .filter((c) => c.status === 'PAID')
      .reduce((s, c) => s + c.amount, 0);

    return {
      commissions,
      totalAmount,
      pendingAmount,
      paidAmount,
      loadCount: commissions.length,
    };
  }

  /** Approve commissions */
  static async approveCommissions(ids: string[], userId: string) {
    return prisma.dispatcherCommission.updateMany({
      where: { id: { in: ids } },
      data: { status: 'APPROVED' as CommissionStatus, approvedById: userId, approvedAt: new Date() },
    });
  }

  /** Mark commissions as paid */
  static async markAsPaid(ids: string[]) {
    return prisma.dispatcherCommission.updateMany({
      where: { id: { in: ids } },
      data: { status: 'PAID' as CommissionStatus, paidDate: new Date() },
    });
  }
}
