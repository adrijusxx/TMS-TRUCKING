/**
 * Reserve Release Manager
 * Tracks and calculates factoring reserve releases (90-day hold period)
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { NotFoundError } from '@/lib/errors';

interface ReserveReleaseCalculation {
  invoiceId: string;
  invoiceNumber: string;
  submittedDate: Date;
  releaseDate: Date;
  daysUntilRelease: number;
  reserveAmount: number;
  netAmount: number;
}

export class ReserveReleaseManager {
  /**
   * Calculate reserve release date (90 days from submission)
   */
  calculateReleaseDate(submittedDate: Date): Date {
    const releaseDate = new Date(submittedDate);
    releaseDate.setDate(releaseDate.getDate() + 90);
    return releaseDate;
  }

  /**
   * Get invoices with upcoming reserve releases
   */
  async getUpcomingReleases(
    companyId: string,
    daysAhead: number = 7
  ): Promise<ReserveReleaseCalculation[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        factoringStatus: 'SUBMITTED_TO_FACTOR',
        factoringSubmittedAt: {
          not: null,
          lte: cutoffDate,
        },
        deletedAt: null,
      },
      include: {
        factoringCompany: true,
        customer: true,
      },
    });

    return invoices.map((invoice) => {
      if (!invoice.factoringSubmittedAt || !invoice.factoringCompany) {
        throw new Error('Invalid invoice data for reserve calculation');
      }

      const releaseDate = this.calculateReleaseDate(invoice.factoringSubmittedAt);
      const daysUntilRelease = Math.ceil(
        (releaseDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      const reservePercentage = invoice.factoringCompany.reservePercentage || 10;
      const totalAmount = invoice.totalAmount || invoice.total || 0;
      const reserveAmount = totalAmount * (reservePercentage / 100);
      const netAmount = totalAmount - reserveAmount;

      return {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        submittedDate: invoice.factoringSubmittedAt,
        releaseDate,
        daysUntilRelease,
        reserveAmount,
        netAmount,
      };
    });
  }

  /**
   * Check and release reserves for invoices past 90 days
   */
  async processReserveReleases(companyId: string): Promise<{
    released: number;
    totalAmount: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const invoicesToRelease = await prisma.invoice.findMany({
      where: {
        companyId,
        factoringStatus: 'SUBMITTED_TO_FACTOR',
        factoringSubmittedAt: {
          not: null,
          lte: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        },
        deletedAt: null,
      },
      include: {
        factoringCompany: true,
      },
    });

    let totalReleased = 0;
    let releasedCount = 0;

    for (const invoice of invoicesToRelease) {
      if (!invoice.factoringCompany) continue;

      const reservePercentage = invoice.factoringCompany.reservePercentage || 10;
      const totalAmount = invoice.totalAmount || invoice.total || 0;
      const reserveAmount = totalAmount * (reservePercentage / 100);

      // Update invoice status to indicate reserve released
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          factoringStatus: 'RESERVE_RELEASED',
          reserveReleaseDate: new Date(),
          factoringReserveReleasedAt: new Date(),
        },
      });

      totalReleased += reserveAmount;
      releasedCount++;

      logger.info('Reserve released', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        reserveAmount,
      });
    }

    return {
      released: releasedCount,
      totalAmount: totalReleased,
    };
  }

  /**
   * Get reserve release summary for dashboard
   */
  async getReserveSummary(companyId: string): Promise<{
    totalOnHold: number;
    upcomingReleases: number;
    totalReserveAmount: number;
    upcomingReleaseAmount: number;
  }> {
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        factoringStatus: 'SUBMITTED_TO_FACTOR',
        factoringSubmittedAt: { not: null },
        deletedAt: null,
      },
      include: {
        factoringCompany: true,
      },
    });

    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    let totalReserveAmount = 0;
    let upcomingReleaseAmount = 0;
    let upcomingReleases = 0;

    for (const invoice of invoices) {
      if (!invoice.factoringCompany || !invoice.factoringSubmittedAt) continue;

      const reservePercentage = invoice.factoringCompany.reservePercentage || 10;
      const totalAmount = invoice.totalAmount || invoice.total || 0;
      const reserveAmount = totalAmount * (reservePercentage / 100);
      totalReserveAmount += reserveAmount;

      const releaseDate = this.calculateReleaseDate(invoice.factoringSubmittedAt);
      if (releaseDate <= sevenDaysFromNow && releaseDate >= today) {
        upcomingReleaseAmount += reserveAmount;
        upcomingReleases++;
      }
    }

    return {
      totalOnHold: invoices.length,
      upcomingReleases,
      totalReserveAmount,
      upcomingReleaseAmount,
    };
  }
}























