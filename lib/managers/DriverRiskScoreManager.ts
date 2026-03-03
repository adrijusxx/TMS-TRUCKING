/**
 * DriverRiskScoreManager
 *
 * Computes a composite driver risk score (0 = safest, 100 = highest risk).
 *
 * Weighted factors:
 *   - Safety incidents   30%
 *   - Compliance status  25% (expired docs, violations)
 *   - HOS violations     20%
 *   - Safety events      15% (Samsara harsh events / citations)
 *   - Tenure/experience  10% (newer drivers = higher risk)
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { NotFoundError } from '@/lib/errors/AppError';

export interface RiskScoreBreakdown {
  incidents: number;      // 0-100 sub-score
  compliance: number;     // 0-100 sub-score
  hosViolations: number;  // 0-100 sub-score
  safetyEvents: number;   // 0-100 sub-score
  tenure: number;         // 0-100 sub-score
}

export interface DriverRiskScoreResult {
  driverId: string;
  riskScore: number;         // 0-100 weighted composite
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  breakdown: RiskScoreBreakdown;
  calculatedAt: Date;
}

const WEIGHTS = {
  incidents: 0.30,
  compliance: 0.25,
  hosViolations: 0.20,
  safetyEvents: 0.15,
  tenure: 0.10,
} as const;

/** Clamp a value between 0 and 100. */
function clamp(val: number): number {
  return Math.max(0, Math.min(100, val));
}

export class DriverRiskScoreManager {
  /**
   * Calculate the composite risk score for a driver.
   */
  static async calculateRiskScore(driverId: string): Promise<DriverRiskScoreResult> {
    logger.debug('Calculating risk score', { driverId });

    const driver = await prisma.driver.findFirst({
      where: { id: driverId, deletedAt: null },
      select: { id: true, companyId: true, hireDate: true, employeeStatus: true },
    });

    if (!driver) {
      throw new NotFoundError('Driver', driverId);
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const [incidentScore, complianceScore, hosScore, eventsScore] = await Promise.all([
      this.scoreIncidents(driverId, driver.companyId, oneYearAgo),
      this.scoreCompliance(driverId, driver.companyId),
      this.scoreHOSViolations(driverId, driver.companyId, oneYearAgo),
      this.scoreSafetyEvents(driverId, driver.companyId, oneYearAgo),
    ]);

    const tenureScore = this.scoreTenure(driver.hireDate);

    const breakdown: RiskScoreBreakdown = {
      incidents: Math.round(incidentScore),
      compliance: Math.round(complianceScore),
      hosViolations: Math.round(hosScore),
      safetyEvents: Math.round(eventsScore),
      tenure: Math.round(tenureScore),
    };

    const riskScore = clamp(Math.round(
      incidentScore * WEIGHTS.incidents +
      complianceScore * WEIGHTS.compliance +
      hosScore * WEIGHTS.hosViolations +
      eventsScore * WEIGHTS.safetyEvents +
      tenureScore * WEIGHTS.tenure
    ));

    const riskLevel = this.classifyRisk(riskScore);

    logger.info('Risk score calculated', { driverId, riskScore, riskLevel });

    return {
      driverId,
      riskScore,
      riskLevel,
      breakdown,
      calculatedAt: new Date(),
    };
  }

  /**
   * Incident sub-score (0-100). More incidents and higher severity = higher score.
   */
  private static async scoreIncidents(
    driverId: string, companyId: string, since: Date
  ): Promise<number> {
    const incidents = await prisma.safetyIncident.findMany({
      where: {
        driverId, companyId, deletedAt: null,
        date: { gte: since },
      },
      select: { severity: true },
    });

    if (incidents.length === 0) return 0;

    const severityPoints: Record<string, number> = {
      MINOR: 10,
      MODERATE: 25,
      MAJOR: 50,
      CRITICAL: 75,
      FATAL: 100,
    };

    const total = incidents.reduce(
      (sum, inc) => sum + (severityPoints[inc.severity] ?? 10), 0
    );

    // Scale: 1 minor = 10, 2 major = 100 (capped)
    return clamp(total);
  }

  /**
   * Compliance sub-score (0-100). Expired/missing docs push score up.
   */
  private static async scoreCompliance(
    driverId: string, companyId: string
  ): Promise<number> {
    const dqf = await prisma.dQFDocument.findMany({
      where: { dqf: { driverId } },
      select: { status: true, expirationDate: true },
    });

    if (dqf.length === 0) return 50; // No DQF at all = moderate risk

    let penalty = 0;
    const now = new Date();

    for (const doc of dqf) {
      if (doc.status === 'MISSING') penalty += 15;
      else if (doc.status === 'EXPIRED') penalty += 20;
      else if (doc.status === 'EXPIRING') penalty += 8;
      else if (doc.expirationDate && doc.expirationDate < now) penalty += 20;
    }

    // Check CDL expiration
    const cdl = await prisma.cDLRecord.findUnique({
      where: { driverId },
      select: { expirationDate: true },
    });

    if (cdl) {
      const daysToExpiry = Math.ceil(
        (cdl.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysToExpiry <= 0) penalty += 30;
      else if (daysToExpiry <= 30) penalty += 15;
      else if (daysToExpiry <= 60) penalty += 5;
    } else {
      penalty += 20; // No CDL on file
    }

    // Check medical card
    const medCard = await prisma.medicalCard.findFirst({
      where: { driverId, companyId, deletedAt: null },
      orderBy: { expirationDate: 'desc' },
      select: { expirationDate: true },
    });

    if (medCard) {
      const daysToExpiry = Math.ceil(
        (medCard.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysToExpiry <= 0) penalty += 25;
      else if (daysToExpiry <= 30) penalty += 12;
    } else {
      penalty += 15;
    }

    return clamp(penalty);
  }

  /**
   * HOS violations sub-score (0-100).
   */
  private static async scoreHOSViolations(
    driverId: string, companyId: string, since: Date
  ): Promise<number> {
    const violations = await prisma.hOSViolation.findMany({
      where: { driverId, companyId, violationDate: { gte: since } },
      select: { violationType: true },
    });

    if (violations.length === 0) return 0;

    const typePoints: Record<string, number> = {
      EXCEEDED_11_HOUR: 20,
      EXCEEDED_14_HOUR: 20,
      EXCEEDED_70_HOUR: 25,
      MISSING_LOG: 15,
      FORM_AND_MANNER: 10,
      UNASSIGNED_DRIVING: 15,
      DATA_QUALITY: 8,
      OTHER: 10,
    };

    const total = violations.reduce(
      (sum, v) => sum + (typePoints[v.violationType] ?? 10), 0
    );

    return clamp(total);
  }

  /**
   * Safety events sub-score (0-100). Citations, roadside inspections with violations.
   */
  private static async scoreSafetyEvents(
    driverId: string, companyId: string, since: Date
  ): Promise<number> {
    const [citations, inspections] = await Promise.all([
      prisma.citation.count({
        where: {
          driverId, companyId,
          citationDate: { gte: since },
          status: { not: 'DISMISSED' },
        },
      }),
      prisma.roadsideInspection.count({
        where: {
          driverId, companyId,
          inspectionDate: { gte: since },
          outOfService: true,
        },
      }),
    ]);

    // Each citation = 15 points, each OOS inspection = 25 points
    return clamp(citations * 15 + inspections * 25);
  }

  /**
   * Tenure sub-score. Newer drivers have higher risk.
   * 0-6 months = 80, 6-12 months = 50, 1-2 years = 30, 2+ years = 10, no date = 40
   */
  private static scoreTenure(hireDate: Date | null): number {
    if (!hireDate) return 40;

    const monthsEmployed = Math.floor(
      (Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    );

    if (monthsEmployed < 6) return 80;
    if (monthsEmployed < 12) return 50;
    if (monthsEmployed < 24) return 30;
    return 10;
  }

  /** Classify the overall risk level. */
  private static classifyRisk(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 35) return 'MEDIUM';
    return 'LOW';
  }
}
