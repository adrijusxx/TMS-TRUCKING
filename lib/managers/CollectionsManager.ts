/**
 * CollectionsManager
 *
 * Manages invoice collection stages based on days outstanding.
 * Auto-updates stages via daily cron, records collection actions,
 * schedules follow-ups, and handles write-offs.
 */

import { prisma } from '@/lib/prisma';
import { InvoiceStatus } from '@prisma/client';
import { logger } from '@/lib/utils/logger';
import { NotFoundError } from '@/lib/errors';

type CollectionStage = 'CURRENT' | 'PAST_DUE_30' | 'PAST_DUE_60' | 'PAST_DUE_90' | 'COLLECTIONS' | 'WRITTEN_OFF';

function getStageFromDays(daysOverdue: number): CollectionStage {
  if (daysOverdue <= 0) return 'CURRENT';
  if (daysOverdue <= 30) return 'PAST_DUE_30';
  if (daysOverdue <= 60) return 'PAST_DUE_60';
  if (daysOverdue <= 90) return 'PAST_DUE_90';
  return 'COLLECTIONS';
}

export class CollectionsManager {
  /**
   * Batch update collection stages for all unpaid invoices in a company.
   * Called by daily Inngest cron.
   */
  static async updateCollectionStages(companyId: string): Promise<{ updated: number }> {
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        companyId,
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] },
        balance: { gt: 0 },
        collectionStage: { not: 'WRITTEN_OFF' },
      },
      select: { id: true, dueDate: true, collectionStage: true },
    });

    const now = Date.now();
    let updated = 0;

    for (const inv of unpaidInvoices) {
      const daysOverdue = Math.floor((now - new Date(inv.dueDate).getTime()) / 86400000);
      const newStage = getStageFromDays(daysOverdue);

      if (newStage !== inv.collectionStage) {
        await prisma.invoice.update({
          where: { id: inv.id },
          data: {
            collectionStage: newStage,
            // Also sync invoice status for overdue items
            ...(daysOverdue > 0 ? { status: InvoiceStatus.OVERDUE } : {}),
          },
        });
        updated++;
      }
    }

    logger.info('Collection stages updated', { companyId, updated, total: unpaidInvoices.length });
    return { updated };
  }

  /**
   * Record a collection action (phone call, email, letter, etc.)
   */
  static async recordCollectionAction(
    invoiceId: string,
    action: string,
    userId: string,
    notes?: string,
    nextFollowUpDate?: Date
  ) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { companyId: true, invoiceNumber: true },
    });

    if (!invoice) throw new NotFoundError('Invoice', invoiceId);

    const [updatedInvoice] = await prisma.$transaction([
      prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          lastCollectionDate: new Date(),
          ...(nextFollowUpDate ? { nextFollowUpDate } : {}),
          ...(notes ? { collectionNotes: notes } : {}),
        },
      }),
      prisma.activityLog.create({
        data: {
          companyId: invoice.companyId,
          userId,
          action: 'COLLECTION_ACTION',
          entityType: 'Invoice',
          entityId: invoiceId,
          description: `Collection action on ${invoice.invoiceNumber}: ${action}`,
          metadata: { action, notes, nextFollowUpDate: nextFollowUpDate?.toISOString() },
        },
      }),
    ]);

    return updatedInvoice;
  }

  /**
   * Schedule a follow-up date for an invoice.
   */
  static async scheduleFollowUp(invoiceId: string, date: Date, userId: string) {
    return this.recordCollectionAction(invoiceId, 'FOLLOW_UP_SCHEDULED', userId, undefined, date);
  }

  /**
   * Write off an invoice balance.
   */
  static async writeOff(invoiceId: string, reason: string, userId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { companyId: true, invoiceNumber: true, balance: true },
    });

    if (!invoice) throw new NotFoundError('Invoice', invoiceId);

    const [updatedInvoice] = await prisma.$transaction([
      prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          collectionStage: 'WRITTEN_OFF',
          subStatus: 'WRITTEN_OFF',
          writtenOffAt: new Date(),
          writtenOffReason: reason,
          writtenOffById: userId,
        },
      }),
      prisma.activityLog.create({
        data: {
          companyId: invoice.companyId,
          userId,
          action: 'INVOICE_WRITE_OFF',
          entityType: 'Invoice',
          entityId: invoiceId,
          description: `Invoice ${invoice.invoiceNumber} written off ($${invoice.balance?.toFixed(2)}): ${reason}`,
          metadata: { reason, balance: invoice.balance },
        },
      }),
    ]);

    return updatedInvoice;
  }

  /**
   * Get invoices grouped by collection stage for a company.
   */
  static async getCollectionsQueue(companyId: string) {
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] },
        balance: { gt: 0 },
      },
      include: {
        customer: { select: { id: true, name: true, customerNumber: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const stages: Record<string, typeof invoices> = {
      CURRENT: [],
      PAST_DUE_30: [],
      PAST_DUE_60: [],
      PAST_DUE_90: [],
      COLLECTIONS: [],
      WRITTEN_OFF: [],
    };

    for (const inv of invoices) {
      const stage = (inv.collectionStage as string) || 'CURRENT';
      if (stages[stage]) stages[stage].push(inv);
      else stages['CURRENT'].push(inv);
    }

    return stages;
  }
}
