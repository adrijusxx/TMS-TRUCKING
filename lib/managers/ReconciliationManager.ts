/**
 * Reconciliation Manager
 * Business logic for payment reconciliation
 */

import { prisma } from '../prisma';

export class ReconciliationManager {
  /**
   * Reconcile a payment to an invoice
   */
  static async reconcile(data: {
    invoiceId: string;
    paymentId?: string;
    reconciledAmount: number;
    reconciledById: string;
    notes?: string;
  }) {
    // Get invoice with existing reconciliations
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      include: {
        reconciliations: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Verify payment if provided
    if (data.paymentId) {
      const payment = await prisma.payment.findFirst({
        where: {
          id: data.paymentId,
          invoiceId: data.invoiceId,
        },
      });

      if (!payment) {
        throw new Error('Payment not found or does not belong to invoice');
      }
    }

    // Calculate total reconciled amount
    const totalReconciled = invoice.reconciliations.reduce(
      (sum, rec) => sum + rec.reconciledAmount,
      0
    );
    const newTotalReconciled = totalReconciled + data.reconciledAmount;

    // Check if reconciled amount exceeds invoice total
    if (newTotalReconciled > invoice.total) {
      throw new Error('Reconciled amount exceeds invoice total');
    }

    // Create reconciliation
    const reconciliation = await prisma.reconciliation.create({
      data: {
        invoiceId: data.invoiceId,
        paymentId: data.paymentId || null,
        reconciledAmount: data.reconciledAmount,
        reconciledAt: new Date(),
        reconciledById: data.reconciledById,
        notes: data.notes,
      },
    });

    // Update invoice reconciliation status
    let reconciliationStatus = 'NOT_RECONCILED';
    if (newTotalReconciled >= invoice.total) {
      reconciliationStatus = 'FULLY_RECONCILED';
    } else if (newTotalReconciled > 0) {
      reconciliationStatus = 'PARTIALLY_RECONCILED';
    }

    await prisma.invoice.update({
      where: { id: data.invoiceId },
      data: {
        reconciliationStatus: reconciliationStatus as any,
      },
    });

    return reconciliation;
  }
}

