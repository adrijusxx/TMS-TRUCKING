/**
 * Payment Manager
 * Business logic for payment processing
 */

import { prisma } from '../prisma';
import { PaymentMethod } from '@prisma/client';

export class PaymentManager {
  /**
   * Create a payment and update invoice
   */
  static async createPayment(data: {
    invoiceId: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    notes?: string;
    createdById: string;
  }) {
    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Generate payment number
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Calculate new invoice amounts
    const newAmountPaid = (invoice.amountPaid || 0) + data.amount;
    const newBalance = invoice.total - newAmountPaid;

    let newStatus = invoice.status;
    if (newBalance <= 0) {
      newStatus = 'PAID';
    } else if (newAmountPaid > 0) {
      newStatus = 'PARTIAL';
    }

    // Create payment and update invoice in transaction
    return await prisma.$transaction([
      prisma.payment.create({
        data: {
          invoiceId: data.invoiceId,
          paymentNumber,
          amount: data.amount,
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber,
          notes: data.notes,
          createdById: data.createdById,
        },
      }),
      prisma.invoice.update({
        where: { id: data.invoiceId },
        data: {
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
          paidDate: newBalance <= 0 ? new Date() : invoice.paidDate,
        },
      }),
    ]);
  }
}

