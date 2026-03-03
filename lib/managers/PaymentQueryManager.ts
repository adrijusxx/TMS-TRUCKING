import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import type { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaymentCreateInput {
  invoiceId?: string | null;
  fuelEntryId?: string | null;
  breakdownId?: string | null;
  type: 'INVOICE' | 'FUEL' | 'BREAKDOWN' | 'OTHER';
  mcNumberId?: string | null;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  paymentInstrumentId?: string | null;
  referenceNumber?: string;
  receiptNumber?: string;
  invoiceNumber?: string;
  hasReceipt: boolean;
  hasInvoice: boolean;
  documentIds?: string[];
  notes?: string;
}

interface PaymentCreateResult {
  success: boolean;
  data?: any;
  error?: { code: string; message: string };
  statusCode?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Prisma include clause for payment list and creation responses */
const PAYMENT_INCLUDE = {
  invoice: {
    include: {
      customer: { select: { id: true, name: true, customerNumber: true } },
    },
  },
  fuelEntry: {
    select: { id: true, date: true, totalCost: true, truck: { select: { truckNumber: true } } },
  },
  breakdown: {
    select: { id: true, breakdownNumber: true, totalCost: true },
  },
  mcNumber: {
    select: { id: true, number: true, companyName: true },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true },
  },
};

// ---------------------------------------------------------------------------
// Manager
// ---------------------------------------------------------------------------

/**
 * PaymentQueryManager - handles payment entity verification and
 * invoice balance updates after payment creation.
 */
export class PaymentQueryManager {

  /** Verify that referenced entities belong to the company */
  static async verifyEntities(
    input: PaymentCreateInput,
    companyId: string,
  ): Promise<PaymentCreateResult> {
    // Type-specific entity ID requirement
    if (input.type === 'INVOICE' && !input.invoiceId) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'invoiceId is required for INVOICE type payments' }, statusCode: 400 };
    }
    if (input.type === 'FUEL' && !input.fuelEntryId) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'fuelEntryId is required for FUEL type payments' }, statusCode: 400 };
    }
    if (input.type === 'BREAKDOWN' && !input.breakdownId) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'breakdownId is required for BREAKDOWN type payments' }, statusCode: 400 };
    }

    let invoice = null;

    if (input.invoiceId) {
      invoice = await prisma.invoice.findFirst({
        where: { id: input.invoiceId, customer: { companyId } },
      });
      if (!invoice) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' }, statusCode: 404 };
      }
    }

    if (input.fuelEntryId) {
      const fuelEntry = await prisma.fuelEntry.findFirst({
        where: { id: input.fuelEntryId, truck: { companyId } },
      });
      if (!fuelEntry) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Fuel entry not found' }, statusCode: 404 };
      }
    }

    if (input.breakdownId) {
      const breakdown = await prisma.breakdown.findFirst({
        where: { id: input.breakdownId, companyId, deletedAt: null },
      });
      if (!breakdown) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Breakdown not found' }, statusCode: 404 };
      }
    }

    return { success: true, data: { invoice } };
  }

  /** Resolve MC number ID for a new payment */
  static async resolveMcNumberId(
    input: PaymentCreateInput,
    companyId: string,
    session: any,
    request: NextRequest,
  ): Promise<string | null> {
    if (input.mcNumberId) {
      const mcNumber = await prisma.mcNumber.findFirst({
        where: { id: input.mcNumberId, companyId, deletedAt: null },
      });
      if (!mcNumber) return null; // Will be handled as error in caller
      return mcNumber.id;
    }

    // Inherit from linked breakdown
    if (input.breakdownId) {
      const breakdown = await prisma.breakdown.findUnique({
        where: { id: input.breakdownId },
        select: { mcNumberId: true },
      });
      if (breakdown?.mcNumberId) return breakdown.mcNumberId;
    }

    // Fallback to session context
    const { McStateManager } = await import('@/lib/managers/McStateManager');
    return McStateManager.determineActiveCreationMc(session, request);
  }

  /** Update invoice balance and status after a payment */
  static async updateInvoiceAfterPayment(invoice: any, amount: number): Promise<void> {
    if (!invoice) return;

    const newAmountPaid = (invoice.amountPaid || 0) + amount;
    const newBalance = invoice.total - newAmountPaid;

    let newStatus = invoice.status;
    if (newBalance <= 0) newStatus = 'PAID';
    else if (newAmountPaid > 0) newStatus = 'PARTIAL';

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: newAmountPaid,
        balance: newBalance,
        status: newStatus,
        paidDate: newBalance <= 0 ? new Date() : invoice.paidDate,
      },
    });
  }

  /** The shared Prisma include for payment responses */
  static get paymentInclude() {
    return PAYMENT_INCLUDE;
  }
}
