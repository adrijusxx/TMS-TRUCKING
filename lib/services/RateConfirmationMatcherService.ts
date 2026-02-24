/**
 * RateConfirmationMatcherService
 *
 * Compares rate confirmation amounts against load revenue to detect discrepancies.
 * Integrates with InvoiceValidationManager to flag mismatches before invoicing.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

interface MatchResult {
  loadId: string;
  loadNumber: string;
  loadRevenue: number;
  rateConAmount: number | null;
  discrepancy: number;
  percentDiff: number;
  hasRateCon: boolean;
  matched: boolean;
}

interface BatchDetectResult {
  totalChecked: number;
  matched: number;
  mismatched: number;
  missingRateCon: number;
  discrepancies: MatchResult[];
}

export class RateConfirmationMatcherService {
  /**
   * Match a single load's revenue against its rate confirmation.
   */
  static async matchRateConToLoad(loadId: string): Promise<MatchResult> {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: {
        id: true,
        loadNumber: true,
        revenue: true,
        rateConfirmation: {
          select: { totalRate: true },
        },
      },
    });

    if (!load) throw new Error('Load not found');

    const rateConAmount = load.rateConfirmation?.totalRate ?? null;
    const loadRevenue = load.revenue || 0;
    const discrepancy = rateConAmount !== null ? loadRevenue - rateConAmount : 0;
    const percentDiff = rateConAmount && rateConAmount > 0
      ? (discrepancy / rateConAmount) * 100
      : 0;

    // Matched if within 1% tolerance or no rate con exists
    const matched = rateConAmount === null || Math.abs(percentDiff) <= 1;

    return {
      loadId: load.id,
      loadNumber: load.loadNumber,
      loadRevenue,
      rateConAmount,
      discrepancy,
      percentDiff: Number(percentDiff.toFixed(2)),
      hasRateCon: rateConAmount !== null,
      matched,
    };
  }

  /**
   * Batch detect discrepancies for all delivered/ready-to-bill loads in a company.
   */
  static async detectDiscrepancies(companyId: string): Promise<BatchDetectResult> {
    const loads = await prisma.load.findMany({
      where: {
        companyId,
        status: { in: ['DELIVERED', 'READY_TO_BILL'] },
        invoicedAt: null,
        deletedAt: null,
      },
      select: {
        id: true,
        loadNumber: true,
        revenue: true,
        rateConfirmation: {
          select: { totalRate: true },
        },
      },
    });

    const result: BatchDetectResult = {
      totalChecked: loads.length,
      matched: 0,
      mismatched: 0,
      missingRateCon: 0,
      discrepancies: [],
    };

    for (const load of loads) {
      const rateConAmount = load.rateConfirmation?.totalRate ?? null;
      const loadRevenue = load.revenue || 0;

      if (rateConAmount === null) {
        result.missingRateCon++;
        continue;
      }

      const discrepancy = loadRevenue - rateConAmount;
      const percentDiff = rateConAmount > 0 ? (discrepancy / rateConAmount) * 100 : 0;
      const matched = Math.abs(percentDiff) <= 1;

      if (matched) {
        result.matched++;
      } else {
        result.mismatched++;
        result.discrepancies.push({
          loadId: load.id,
          loadNumber: load.loadNumber,
          loadRevenue,
          rateConAmount,
          discrepancy,
          percentDiff: Number(percentDiff.toFixed(2)),
          hasRateCon: true,
          matched: false,
        });
      }
    }

    if (result.mismatched > 0) {
      logger.warn('Rate confirmation discrepancies found', {
        companyId,
        mismatched: result.mismatched,
        total: result.totalChecked,
      });
    }

    return result;
  }
}
