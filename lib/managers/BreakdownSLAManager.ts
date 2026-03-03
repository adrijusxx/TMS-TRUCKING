/**
 * BreakdownSLAManager
 *
 * Tracks SLA compliance for breakdown cases by comparing
 * target response times against actual response/resolution times.
 *
 * SLA targets by breakdown type:
 * - Towing: 2 hours
 * - Roadside repair: 4 hours
 * - Shop repair: 24 hours
 */
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { NotFoundError } from '@/lib/errors';

/** SLA target hours by service type */
const SLA_TARGETS: Record<string, number> = {
  TOWING: 2,
  ROADSIDE: 4,
  SHOP: 24,
};

type SLAStatus = 'met' | 'at_risk' | 'breached';

interface SLAResult {
  breakdownId: string;
  breakdownNumber: string;
  serviceType: string;
  targetHours: number;
  elapsedHours: number;
  remainingHours: number;
  percentElapsed: number;
  status: SLAStatus;
  reportedAt: string;
  resolvedAt: string | null;
}

interface SLAMetrics {
  total: number;
  met: number;
  atRisk: number;
  breached: number;
  complianceRate: number;
  averageResponseHours: number;
  byServiceType: Record<string, { total: number; met: number; breached: number }>;
  breakdowns: SLAResult[];
}

/**
 * Determine the service type for a breakdown based on its type and status.
 * - If towing cost exists or type indicates towing scenario, classify as TOWING
 * - If repair was done on-site (no shop), classify as ROADSIDE
 * - Otherwise, classify as SHOP
 */
function classifyServiceType(breakdown: {
  breakdownType: string;
  towingCost: number | null;
  serviceAddress: string | null;
}): string {
  if (breakdown.towingCost && breakdown.towingCost > 0) return 'TOWING';
  if (!breakdown.serviceAddress) return 'ROADSIDE';
  return 'SHOP';
}

/**
 * Calculate SLA status based on percentage of target time elapsed.
 */
function calculateSLAStatus(percentElapsed: number, isResolved: boolean): SLAStatus {
  if (isResolved) {
    return percentElapsed <= 100 ? 'met' : 'breached';
  }
  if (percentElapsed > 100) return 'breached';
  if (percentElapsed > 75) return 'at_risk';
  return 'met';
}

export class BreakdownSLAManager {
  /**
   * Track SLA for a single breakdown case.
   */
  static async trackSLA(breakdownId: string): Promise<SLAResult> {
    const breakdown = await prisma.breakdown.findUnique({
      where: { id: breakdownId },
      select: {
        id: true,
        breakdownNumber: true,
        breakdownType: true,
        reportedAt: true,
        dispatchedAt: true,
        arrivedAt: true,
        repairCompletedAt: true,
        truckReadyAt: true,
        status: true,
        towingCost: true,
        serviceAddress: true,
      },
    });

    if (!breakdown) {
      throw new NotFoundError('Breakdown', breakdownId);
    }

    const serviceType = classifyServiceType(breakdown);
    const targetHours = SLA_TARGETS[serviceType] ?? SLA_TARGETS.SHOP;
    const reportedAt = new Date(breakdown.reportedAt);

    // Resolution time is the earliest of: truckReadyAt, repairCompletedAt, or arrivedAt for towing
    const resolutionDate = serviceType === 'TOWING'
      ? breakdown.arrivedAt ?? breakdown.repairCompletedAt ?? breakdown.truckReadyAt
      : breakdown.repairCompletedAt ?? breakdown.truckReadyAt;

    const isResolved = resolutionDate !== null;
    const endTime = resolutionDate ? new Date(resolutionDate) : new Date();
    const elapsedMs = endTime.getTime() - reportedAt.getTime();
    const elapsedHours = Math.max(0, elapsedMs / (1000 * 60 * 60));
    const remainingHours = Math.max(0, targetHours - elapsedHours);
    const percentElapsed = (elapsedHours / targetHours) * 100;
    const status = calculateSLAStatus(percentElapsed, isResolved);

    logger.debug('SLA tracked for breakdown', {
      breakdownId,
      serviceType,
      elapsedHours: Math.round(elapsedHours * 100) / 100,
      status,
    });

    return {
      breakdownId: breakdown.id,
      breakdownNumber: breakdown.breakdownNumber,
      serviceType,
      targetHours,
      elapsedHours: Math.round(elapsedHours * 100) / 100,
      remainingHours: Math.round(remainingHours * 100) / 100,
      percentElapsed: Math.round(percentElapsed * 10) / 10,
      status,
      reportedAt: reportedAt.toISOString(),
      resolvedAt: resolutionDate ? new Date(resolutionDate).toISOString() : null,
    };
  }

  /**
   * Get SLA metrics for a company within a date range.
   */
  static async getSLAMetrics(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SLAMetrics> {
    const breakdowns = await prisma.breakdown.findMany({
      where: {
        companyId,
        deletedAt: null,
        reportedAt: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        breakdownNumber: true,
        breakdownType: true,
        reportedAt: true,
        dispatchedAt: true,
        arrivedAt: true,
        repairCompletedAt: true,
        truckReadyAt: true,
        status: true,
        towingCost: true,
        serviceAddress: true,
      },
      orderBy: { reportedAt: 'desc' },
    });

    const results: SLAResult[] = [];
    const byServiceType: Record<string, { total: number; met: number; breached: number }> = {};
    let totalResponseHours = 0;

    for (const bd of breakdowns) {
      const serviceType = classifyServiceType(bd);
      const targetHours = SLA_TARGETS[serviceType] ?? SLA_TARGETS.SHOP;
      const reportedAt = new Date(bd.reportedAt);

      const resolutionDate = serviceType === 'TOWING'
        ? bd.arrivedAt ?? bd.repairCompletedAt ?? bd.truckReadyAt
        : bd.repairCompletedAt ?? bd.truckReadyAt;

      const isResolved = resolutionDate !== null;
      const endTime = resolutionDate ? new Date(resolutionDate) : new Date();
      const elapsedHours = Math.max(0, (endTime.getTime() - reportedAt.getTime()) / (1000 * 60 * 60));
      const remainingHours = Math.max(0, targetHours - elapsedHours);
      const percentElapsed = (elapsedHours / targetHours) * 100;
      const status = calculateSLAStatus(percentElapsed, isResolved);

      totalResponseHours += elapsedHours;

      if (!byServiceType[serviceType]) {
        byServiceType[serviceType] = { total: 0, met: 0, breached: 0 };
      }
      byServiceType[serviceType].total += 1;
      if (status === 'met') byServiceType[serviceType].met += 1;
      if (status === 'breached') byServiceType[serviceType].breached += 1;

      results.push({
        breakdownId: bd.id,
        breakdownNumber: bd.breakdownNumber,
        serviceType,
        targetHours,
        elapsedHours: Math.round(elapsedHours * 100) / 100,
        remainingHours: Math.round(remainingHours * 100) / 100,
        percentElapsed: Math.round(percentElapsed * 10) / 10,
        status,
        reportedAt: reportedAt.toISOString(),
        resolvedAt: resolutionDate ? new Date(resolutionDate).toISOString() : null,
      });
    }

    const met = results.filter((r) => r.status === 'met').length;
    const atRisk = results.filter((r) => r.status === 'at_risk').length;
    const breached = results.filter((r) => r.status === 'breached').length;

    return {
      total: results.length,
      met,
      atRisk,
      breached,
      complianceRate: results.length > 0 ? Math.round((met / results.length) * 1000) / 10 : 100,
      averageResponseHours:
        results.length > 0 ? Math.round((totalResponseHours / results.length) * 100) / 100 : 0,
      byServiceType,
      breakdowns: results,
    };
  }
}
