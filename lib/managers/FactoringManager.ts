/**
 * FactoringManager
 * Handles factoring company operations, invoice submissions, and funding tracking
 */

import { prisma } from '@/lib/prisma';
import { FactoringStatus, Invoice, FactoringCompany } from '@prisma/client';
import {
  calculateReserveAmount,
  calculateAdvanceAmount,
  calculateFactoringFee,
  calculateReserveReleaseDate,
  shouldReleaseReserve,
  getFactoringConfig,
} from '@/lib/utils/factoring';

import { convertMcNumberIdToMcNumberString } from '@/lib/mc-number-filter';

export class FactoringManager {
  /**
   * Submit invoice(s) to factoring company
   */
  static async submitToFactor(data: {
    invoiceIds: string[];
    factoringCompanyId: string;
    companyId: string;
    submittedById: string;
    notes?: string;
  }) {
    // ... existing implementation remains unchanged ...
    const { invoiceIds, factoringCompanyId, companyId, submittedById, notes } = data;

    // Verify factoring company
    const factoringCompany = await prisma.factoringCompany.findFirst({
      where: {
        id: factoringCompanyId,
        companyId,
        isActive: true,
      },
    });

    if (!factoringCompany) {
      throw new Error('Factoring company not found or inactive');
    }

    // Verify all invoices belong to company and can be factored
    const invoices = await prisma.invoice.findMany({
      where: {
        id: { in: invoiceIds },
        customer: {
          companyId,
        },
      },
      include: {
        customer: true,
      },
    });

    if (invoices.length !== invoiceIds.length) {
      throw new Error('Some invoices not found or do not belong to company');
    }

    // Validate invoices can be factored
    for (const invoice of invoices) {
      if (invoice.factoringStatus !== 'NOT_FACTORED') {
        throw new Error(`Invoice ${invoice.invoiceNumber} is already factored`);
      }
      if (invoice.balance <= 0) {
        throw new Error(`Invoice ${invoice.invoiceNumber} has no outstanding balance`);
      }
    }

    // Calculate factoring amounts for each invoice
    const updates = invoices.map((invoice) => {
      const config = getFactoringConfig(
        invoice as Invoice & { factoringCompany?: FactoringCompany | null },
        factoringCompany.reservePercentage,
        factoringCompany.reserveHoldDays
      );

      const reserveAmount = calculateReserveAmount(invoice.total, config.reservePercentage);
      const advanceAmount = calculateAdvanceAmount(invoice.total, config.reservePercentage);
      const factoringFee = calculateFactoringFee(invoice.total, 3); // Default 3% fee

      return {
        id: invoice.id,
        reserveAmount,
        advanceAmount,
        factoringFee,
        reserveReleaseDate: null, // Will be set when funded
        invoiceNote: invoice.invoiceNote || null,
      };
    });

    // Update invoices
    const updatePromises = updates.map((update) =>
      prisma.invoice.update({
        where: { id: update.id },
        data: {
          factoringStatus: FactoringStatus.SUBMITTED_TO_FACTOR,
          factoringCompanyId,
          submittedToFactorAt: new Date(),
          reserveAmount: update.reserveAmount,
          advanceAmount: update.advanceAmount,
          factoringFee: update.factoringFee,
          invoiceNote: notes
            ? `${update.invoiceNote || ''}\nSubmitted to factor: ${notes}`.trim()
            : update.invoiceNote || undefined,
        },
      })
    );

    await Promise.all(updatePromises);

    // TODO: Export to factoring company (API or file)
    // await this.exportToFactoringCompany(factoringCompany, invoices);

    return {
      success: true,
      count: invoices.length,
      invoices: await prisma.invoice.findMany({
        where: { id: { in: invoiceIds } },
        include: {
          factoringCompany: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    };
  }

  /**
   * Mark invoice as funded by factoring company
   */
  static async markAsFunded(data: {
    invoiceId: string;
    companyId: string;
    fundedAt?: Date;
    fundedAmount?: number;
    actualFee?: number;
  }) {
    const { invoiceId, companyId, fundedAt, fundedAmount, actualFee } = data;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        customer: {
          companyId,
        },
        factoringStatus: FactoringStatus.SUBMITTED_TO_FACTOR,
      },
      include: {
        factoringCompany: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found or not submitted to factor');
    }

    const config = getFactoringConfig(
      invoice as Invoice & { factoringCompany?: FactoringCompany | null }
    );

    const reserveReleaseDate = calculateReserveReleaseDate(
      fundedAt || new Date(),
      config.reserveHoldDays
    );

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        factoringStatus: FactoringStatus.FUNDED,
        fundedAt: fundedAt || new Date(),
        advanceAmount: fundedAmount || invoice.advanceAmount,
        factoringFee: actualFee || invoice.factoringFee,
        reserveReleaseDate,
      },
      include: {
        factoringCompany: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedInvoice;
  }

  /**
   * Release reserve for invoice
   */
  static async releaseReserve(data: {
    invoiceId: string;
    companyId: string;
    releasedById: string;
  }) {
    const { invoiceId, companyId, releasedById } = data;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        customer: {
          companyId,
        },
        factoringStatus: FactoringStatus.FUNDED,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found or not funded');
    }

    if (!invoice.fundedAt) {
      throw new Error('Invoice funding date not set');
    }

    // Check if reserve should be released
    if (!shouldReleaseReserve(invoice.fundedAt, 90)) {
      throw new Error('Reserve hold period has not elapsed');
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        factoringStatus: FactoringStatus.RESERVE_RELEASED,
        reserveReleaseDate: new Date(),
      },
    });

    // TODO: Log reserve release activity

    return updatedInvoice;
  }

  /**
   * Get factoring statistics for a company
   */
  static async getFactoringStats(mcWhere: { companyId: string; mcNumberId?: any }, dateRange?: { start: Date; end: Date }) {
    // Convert mcNumberId to mcNumber string if present, as Invoice model might not have mcNumberId yet
    const effectiveMcWhere = await convertMcNumberIdToMcNumberString(mcWhere);

    const where: any = {
      customer: {
        companyId: effectiveMcWhere.companyId,
      },
      // Use the converted filter (mcNumber or nothing)
      ...(effectiveMcWhere.mcNumber ? { mcNumber: effectiveMcWhere.mcNumber } : {}),
      factoringStatus: { not: FactoringStatus.NOT_FACTORED },
    };

    if (dateRange) {
      where.submittedToFactorAt = {
        gte: dateRange.start,
        lte: dateRange.end,
      };
    }

    const [submitted, funded, totalSubmittedAmount, totalFundedAmount, totalReserveHeld, totalFeesPaid] =
      await Promise.all([
        prisma.invoice.count({
          where: {
            ...where,
            factoringStatus: FactoringStatus.SUBMITTED_TO_FACTOR,
          },
        }),
        prisma.invoice.count({
          where: {
            ...where,
            factoringStatus: FactoringStatus.FUNDED,
          },
        }),
        prisma.invoice.aggregate({
          where: {
            ...where,
            factoringStatus: FactoringStatus.SUBMITTED_TO_FACTOR,
          },
          _sum: {
            total: true,
          },
        }),
        prisma.invoice.aggregate({
          where: {
            ...where,
            factoringStatus: FactoringStatus.FUNDED,
          },
          _sum: {
            advanceAmount: true,
          },
        }),
        prisma.invoice.aggregate({
          where: {
            ...where,
            factoringStatus: { in: [FactoringStatus.FUNDED, FactoringStatus.RESERVE_RELEASED] },
          },
          _sum: {
            reserveAmount: true,
          },
        }),
        prisma.invoice.aggregate({
          where: {
            ...where,
            factoringStatus: { not: FactoringStatus.NOT_FACTORED },
          },
          _sum: {
            factoringFee: true,
          },
        }),
      ]);

    return {
      submitted,
      funded,
      reserveReleased: await prisma.invoice.count({
        where: {
          ...where,
          factoringStatus: FactoringStatus.RESERVE_RELEASED,
        },
      }),
      totalSubmittedAmount: totalSubmittedAmount._sum.total || 0,
      totalFundedAmount: totalFundedAmount._sum.advanceAmount || 0,
      totalReserveHeld: totalReserveHeld._sum.reserveAmount || 0,
      totalFeesPaid: totalFeesPaid._sum.factoringFee || 0,
    };
  }

  /**
   * Get invoices due for reserve release
   */
  static async getInvoicesDueForReserveRelease(mcWhere: { companyId: string; mcNumberId?: any }) {
    // Convert mcNumberId to mcNumber string if present
    const effectiveMcWhere = await convertMcNumberIdToMcNumberString(mcWhere);

    const fundedInvoices = await prisma.invoice.findMany({
      where: {
        customer: {
          companyId: effectiveMcWhere.companyId,
        },
        // Use the converted filter (mcNumber or nothing)
        ...(effectiveMcWhere.mcNumber ? { mcNumber: effectiveMcWhere.mcNumber } : {}),
        factoringStatus: FactoringStatus.FUNDED,
        fundedAt: { not: null },
      },
      // Use explicit select to avoid fetching mcNumberId which may not exist in DB
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        reserveAmount: true,
        advanceAmount: true,
        fundedAt: true,
        reserveReleaseDate: true,
        mcNumber: true,
        factoringCompany: {
          select: {
            id: true,
            name: true,
            reserveHoldDays: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const dueForRelease = fundedInvoices.filter((invoice) => {
      if (!invoice.fundedAt || !invoice.factoringCompany) return false;
      const holdDays = invoice.factoringCompany.reserveHoldDays || 90;
      return shouldReleaseReserve(invoice.fundedAt, holdDays);
    });

    return dueForRelease;
  }

  /**
   * Export invoices to factoring company
   * TODO: Implement actual export logic based on factoring company configuration
   */
  private static async exportToFactoringCompany(
    factoringCompany: FactoringCompany,
    invoices: Invoice[]
  ) {
    // This would implement:
    // - API integration (RTS, TAFS, etc.)
    // - CSV/EDI file generation
    // - Email/FTP upload
    // - Based on factoringCompany.apiProvider or exportFormat

    throw new Error('Export functionality not yet implemented');
  }
}

