/**
 * PaymentInstrumentManager
 *
 * Manages credit cards, Zelle, Cash App, and other payment accounts.
 * Handles spending limit tracking and alert checking.
 */

import { prisma } from '@/lib/prisma';
import { PaymentInstrumentType } from '@prisma/client';

interface CreateInstrumentData {
  companyId: string;
  mcNumberId?: string | null;
  name: string;
  institutionName: string;
  type: PaymentInstrumentType;
  lastFour?: string | null;
  cardholderName?: string | null;
  notes?: string | null;
  color?: string | null;
  monthlyLimit?: number | null;
  alertThreshold?: number | null;
}

interface SpendingSummary {
  instrumentId: string;
  currentMonthSpend: number;
  monthlyLimit: number | null;
  alertThreshold: number | null;
  isOverLimit: boolean;
  isOverAlert: boolean;
}

export class PaymentInstrumentManager {
  /**
   * Create a new payment instrument (credit card, Zelle, etc.)
   */
  async createInstrument(data: CreateInstrumentData) {
    return prisma.paymentInstrument.create({
      data: {
        companyId: data.companyId,
        mcNumberId: data.mcNumberId ?? null,
        name: data.name,
        institutionName: data.institutionName,
        type: data.type,
        lastFour: data.lastFour ?? null,
        cardholderName: data.cardholderName ?? null,
        notes: data.notes ?? null,
        color: data.color ?? null,
        monthlyLimit: data.monthlyLimit ?? null,
        alertThreshold: data.alertThreshold ?? null,
        isActive: true,
      },
    });
  }

  /**
   * Get current month's total spend across all sources for an instrument
   */
  async getMonthlySpend(instrumentId: string, companyId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [companyExpenseSum, paymentSum, loadExpenseSum] = await Promise.all([
      prisma.companyExpense.aggregate({
        where: {
          paymentInstrumentId: instrumentId,
          companyId,
          date: { gte: startOfMonth, lte: endOfMonth },
          deletedAt: null,
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          paymentInstrumentId: instrumentId,
          paymentDate: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.loadExpense.aggregate({
        where: {
          paymentInstrumentId: instrumentId,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
    ]);

    return (
      (companyExpenseSum._sum.amount ?? 0) +
      (paymentSum._sum.amount ?? 0) +
      (loadExpenseSum._sum.amount ?? 0)
    );
  }

  /**
   * Check if a spending alert should be triggered for an instrument.
   * Fires-and-forgets — does not throw.
   */
  async checkSpendingAlert(instrumentId: string, companyId: string): Promise<SpendingSummary | null> {
    try {
      const instrument = await prisma.paymentInstrument.findUnique({
        where: { id: instrumentId },
        select: { monthlyLimit: true, alertThreshold: true, name: true },
      });

      if (!instrument) return null;
      if (!instrument.monthlyLimit && !instrument.alertThreshold) return null;

      const currentMonthSpend = await this.getMonthlySpend(instrumentId, companyId);
      const isOverLimit = instrument.monthlyLimit != null && currentMonthSpend >= instrument.monthlyLimit;
      const isOverAlert = instrument.alertThreshold != null && currentMonthSpend >= instrument.alertThreshold;

      if (isOverAlert || isOverLimit) {
        await prisma.activityLog.create({
          data: {
            action: 'SPENDING_ALERT',
            entityType: 'PAYMENT_INSTRUMENT',
            entityId: instrumentId,
            companyId,
            metadata: {
              instrumentName: instrument.name,
              currentMonthSpend,
              monthlyLimit: instrument.monthlyLimit,
              alertThreshold: instrument.alertThreshold,
              isOverLimit,
              isOverAlert,
            },
          },
        }).catch(() => {/* non-critical */});
      }

      return {
        instrumentId,
        currentMonthSpend,
        monthlyLimit: instrument.monthlyLimit,
        alertThreshold: instrument.alertThreshold,
        isOverLimit,
        isOverAlert,
      };
    } catch {
      return null;
    }
  }

  /**
   * List all active instruments for a company, optionally filtered by MC number
   */
  async listInstruments(companyId: string, mcNumberId?: string | null) {
    return prisma.paymentInstrument.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(mcNumberId ? { OR: [{ mcNumberId }, { mcNumberId: null }] } : {}),
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Soft-delete an instrument
   */
  async deleteInstrument(id: string, companyId: string) {
    return prisma.paymentInstrument.update({
      where: { id, companyId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}

export const paymentInstrumentManager = new PaymentInstrumentManager();
