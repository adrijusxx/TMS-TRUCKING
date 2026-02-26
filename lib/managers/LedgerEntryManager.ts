/**
 * LedgerEntryManager
 *
 * Manages post-payment adjustments (credits, deductions, reimbursements)
 * that carry forward to the next settlement for a driver.
 */

import { prisma } from '@/lib/prisma';
import { LedgerEntryStatus, LedgerEntryType } from '@prisma/client';
import { logger } from '@/lib/utils/logger';

export class LedgerEntryManager {
  /**
   * Create an adjustment entry for a driver.
   */
  static async createAdjustment(data: {
    companyId: string;
    driverId: string;
    type: LedgerEntryType;
    amount: number;
    description: string;
    loadId?: string;
    settlementId?: string;
    createdById: string;
  }) {
    const entry = await prisma.ledgerEntry.create({
      data: {
        companyId: data.companyId,
        driverId: data.driverId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        loadId: data.loadId,
        settlementId: data.settlementId,
        createdById: data.createdById,
      },
    });

    await prisma.activityLog.create({
      data: {
        companyId: data.companyId,
        userId: data.createdById,
        action: 'LEDGER_ENTRY_CREATED',
        entityType: 'LedgerEntry',
        entityId: entry.id,
        description: `${data.type} of $${data.amount.toFixed(2)} for driver: ${data.description}`,
        metadata: { type: data.type, amount: data.amount, driverId: data.driverId },
      },
    });

    logger.info('Ledger entry created', { id: entry.id, driverId: data.driverId, type: data.type, amount: data.amount });
    return entry;
  }

  /**
   * Apply a pending ledger entry to a settlement.
   */
  static async applyToSettlement(entryId: string, targetSettlementId: string) {
    const entry = await prisma.ledgerEntry.findUnique({
      where: { id: entryId },
      select: { status: true },
    });

    if (!entry) throw new Error('Ledger entry not found');
    if (entry.status !== 'PENDING') throw new Error(`Entry is ${entry.status}, cannot apply`);

    const updated = await prisma.ledgerEntry.update({
      where: { id: entryId },
      data: {
        status: LedgerEntryStatus.APPLIED,
        targetSettlementId,
        appliedAt: new Date(),
      },
    });

    logger.info('Ledger entry applied', { entryId, targetSettlementId });
    return updated;
  }

  /**
   * Cancel a pending ledger entry.
   */
  static async cancel(entryId: string, userId: string) {
    const entry = await prisma.ledgerEntry.findUnique({
      where: { id: entryId },
      select: { status: true, companyId: true },
    });

    if (!entry) throw new Error('Ledger entry not found');
    if (entry.status !== 'PENDING') throw new Error(`Entry is ${entry.status}, cannot cancel`);

    const updated = await prisma.ledgerEntry.update({
      where: { id: entryId },
      data: { status: LedgerEntryStatus.CANCELLED },
    });

    await prisma.activityLog.create({
      data: {
        companyId: entry.companyId,
        userId,
        action: 'LEDGER_ENTRY_CANCELLED',
        entityType: 'LedgerEntry',
        entityId: entryId,
      },
    });

    return updated;
  }

  /**
   * Get pending entries for a driver (to include in next settlement).
   */
  static async getPendingEntries(driverId: string) {
    return prisma.ledgerEntry.findMany({
      where: {
        driverId,
        status: LedgerEntryStatus.PENDING,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get the net pending amount for a driver.
   * Positive = driver owes, Negative = company owes driver
   */
  static async getPendingBalance(driverId: string): Promise<{
    totalCredits: number;
    totalDeductions: number;
    netBalance: number;
    entryCount: number;
  }> {
    const entries = await this.getPendingEntries(driverId);

    let totalCredits = 0;
    let totalDeductions = 0;

    for (const entry of entries) {
      if (entry.type === 'CREDIT' || entry.type === 'REIMBURSEMENT') {
        totalCredits += entry.amount;
      } else {
        totalDeductions += entry.amount;
      }
    }

    return {
      totalCredits,
      totalDeductions,
      netBalance: totalCredits - totalDeductions,
      entryCount: entries.length,
    };
  }
}
