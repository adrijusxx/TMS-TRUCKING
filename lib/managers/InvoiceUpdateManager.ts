import { prisma } from '@/lib/prisma';
import { InvoiceStatus } from '@prisma/client';
import { logger } from '@/lib/utils/logger';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The large select clause for single-invoice GET */
export const INVOICE_DETAIL_SELECT = {
  id: true, companyId: true, customerId: true, invoiceNumber: true,
  loadIds: true, subtotal: true, tax: true, total: true,
  amountPaid: true, balance: true, status: true,
  invoiceDate: true, dueDate: true, paidDate: true,
  qbSynced: true, qbInvoiceId: true, qbSyncedAt: true,
  qbSyncStatus: true, qbSyncError: true, qbCustomerId: true,
  mcNumber: true, subStatus: true, reconciliationStatus: true,
  invoiceNote: true, paymentNote: true, loadId: true,
  totalAmount: true, paymentMethod: true, expectedPaymentDate: true,
  factoringStatus: true, factoringCompanyId: true,
  submittedToFactorAt: true, factoringSubmittedAt: true,
  fundedAt: true, reserveReleaseDate: true, factoringReserveReleasedAt: true,
  factoringFee: true, reserveAmount: true, advanceAmount: true,
  shortPayAmount: true, shortPayReasonCode: true, shortPayReason: true,
  shortPayApproved: true, shortPayApprovedById: true, shortPayApprovedAt: true,
  disputedAt: true, disputedReason: true,
  writtenOffAt: true, writtenOffReason: true, writtenOffById: true,
  notes: true, factoringBatchId: true, invoiceBatchId: true,
  createdAt: true, updatedAt: true, deletedAt: true,
  customer: {
    select: {
      id: true, customerNumber: true, name: true, type: true,
      address: true, city: true, state: true, zip: true,
      phone: true, email: true, paymentTerms: true,
      creditLimit: true, isActive: true,
    },
  },
  factoringCompany: {
    select: { id: true, name: true, accountNumber: true },
  },
  payments: {
    select: {
      id: true, paymentNumber: true, amount: true,
      paymentDate: true, paymentMethod: true,
      referenceNumber: true, notes: true, createdAt: true,
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  reconciliations: {
    select: {
      id: true, reconciledAmount: true, reconciledAt: true, notes: true,
      reconciledBy: { select: { id: true, firstName: true, lastName: true } },
    },
  },
};

// ---------------------------------------------------------------------------
// Manager
// ---------------------------------------------------------------------------

/**
 * InvoiceUpdateManager - builds the PATCH update data from request body fields.
 * Extracted from the invoices/[id] route to reduce file size.
 */
export class InvoiceUpdateManager {

  /** Build the Prisma update data from a PATCH request body */
  static buildUpdateData(body: any, existingInvoice: any): Record<string, any> {
    const updateData: any = {};

    const {
      status, notes, mcNumber, subStatus, reconciliationStatus,
      invoiceNote, paymentNote, loadId, paymentMethod,
      factoringStatus, factoringCompanyId,
      shortPayAmount, shortPayReasonCode, shortPayReason,
      expectedPaymentDate, amountPaid, balance,
      disputedAt, disputedReason, writtenOffAt, writtenOffReason,
    } = body;

    // If marking as paid, update financial fields
    if (status === 'PAID') {
      updateData.amountPaid = existingInvoice.total;
      updateData.balance = 0;
      updateData.paidDate = new Date();
      if (!updateData.subStatus) updateData.subStatus = 'PAID';
    }

    if (status && Object.values(InvoiceStatus).includes(status)) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (mcNumber !== undefined) updateData.mcNumber = mcNumber;
    if (subStatus !== undefined) updateData.subStatus = subStatus;
    if (reconciliationStatus !== undefined) updateData.reconciliationStatus = reconciliationStatus;
    if (invoiceNote !== undefined) updateData.invoiceNote = invoiceNote;
    if (paymentNote !== undefined) updateData.paymentNote = paymentNote;
    if (loadId !== undefined) updateData.loadId = loadId;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (factoringStatus !== undefined) updateData.factoringStatus = factoringStatus;
    if (factoringCompanyId !== undefined) updateData.factoringCompanyId = factoringCompanyId;
    if (shortPayAmount !== undefined) updateData.shortPayAmount = shortPayAmount;
    if (shortPayReasonCode !== undefined) updateData.shortPayReasonCode = shortPayReasonCode;
    if (shortPayReason !== undefined) updateData.shortPayReason = shortPayReason;
    if (expectedPaymentDate !== undefined) {
      updateData.expectedPaymentDate = expectedPaymentDate ? new Date(expectedPaymentDate) : null;
    }
    if (amountPaid !== undefined) updateData.amountPaid = amountPaid;
    if (balance !== undefined) updateData.balance = balance;
    if (disputedAt !== undefined) updateData.disputedAt = disputedAt ? new Date(disputedAt) : null;
    if (disputedReason !== undefined) updateData.disputedReason = disputedReason;
    if (writtenOffAt !== undefined) updateData.writtenOffAt = writtenOffAt ? new Date(writtenOffAt) : null;
    if (writtenOffReason !== undefined) updateData.writtenOffReason = writtenOffReason;

    return updateData;
  }

  /** Fetch the loads associated with an invoice via loadIds */
  static async fetchInvoiceLoads(loadIds: string[] | null, companyId: string): Promise<any[]> {
    if (!loadIds || loadIds.length === 0) return [];

    return prisma.load.findMany({
      where: { id: { in: loadIds }, companyId },
      select: {
        id: true, loadNumber: true,
        pickupCity: true, pickupState: true,
        deliveryCity: true, deliveryState: true,
        revenue: true,
      },
    });
  }
}
