import { PrismaClient } from '@prisma/client';
import { BaseComplianceService } from './BaseComplianceService';

export interface ScoreBreakdown {
  incidents: number;
  hosViolations: number;
  mvrViolations: number;
  drugTests: number;
  inspections: number;
  training: number;
  citations: number;
}

export interface DriverScorecard {
  driverId: string;
  overallScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  breakdown: ScoreBreakdown;
  lastUpdated: Date;
}

export interface ScoreTrend {
  month: string;
  score: number;
}

const SCORE_WEIGHTS = {
  incidents: 25,
  hosViolations: 20,
  mvrViolations: 15,
  drugTests: 10,
  inspections: 10,
  training: 10,
  citations: 10,
} as const;

export class ScorecardService extends BaseComplianceService {
  constructor(prisma: PrismaClient, companyId?: string, mcNumberId?: string) {
    super(prisma, companyId, mcNumberId);
  }

  async calculateDriverScore(driverId: string): Promise<DriverScorecard> {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const breakdown = await this.getScoreBreakdown(driverId, oneYearAgo);
      const overallScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

      return {
        driverId,
        overallScore: Math.round(overallScore * 10) / 10,
        riskLevel: this.classifyRiskLevel(overallScore),
        breakdown,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.handleError(error, 'Failed to calculate driver scorecard');
    }
  }

  async getScoreBreakdown(driverId: string, since?: Date): Promise<ScoreBreakdown> {
    const sinceDate = since ?? new Date(new Date().setFullYear(new Date().getFullYear() - 1));

    const [incidents, hosViolations, mvrViolations, drugTests, inspections, training, citations] =
      await Promise.all([
        this.calculateIncidentScore(driverId, sinceDate),
        this.calculateHOSScore(driverId, sinceDate),
        this.calculateMVRScore(driverId, sinceDate),
        this.calculateDrugTestScore(driverId, sinceDate),
        this.calculateInspectionScore(driverId, sinceDate),
        this.calculateTrainingScore(driverId),
        this.calculateCitationScore(driverId, sinceDate),
      ]);

    return { incidents, hosViolations, mvrViolations, drugTests, inspections, training, citations };
  }

  async calculateDriverScoreTrend(driverId: string, months: number = 6): Promise<ScoreTrend[]> {
    try {
      const trends: ScoreTrend[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const sinceDate = new Date(date);
        sinceDate.setFullYear(sinceDate.getFullYear() - 1);

        const breakdown = await this.getScoreBreakdown(driverId, sinceDate);
        const score = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

        trends.push({
          month: date.toISOString().slice(0, 7),
          score: Math.round(score * 10) / 10,
        });
      }

      return trends;
    } catch (error) {
      this.handleError(error, 'Failed to calculate score trend');
    }
  }

  classifyRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 80) return 'LOW';
    if (score >= 60) return 'MEDIUM';
    if (score >= 40) return 'HIGH';
    return 'CRITICAL';
  }

  private async calculateIncidentScore(driverId: string, since: Date): Promise<number> {
    const incidents = await this.prisma.safetyIncident.findMany({
      where: { driverId, date: { gte: since }, deletedAt: null },
      select: { severity: true },
    });

    if (incidents.length === 0) return SCORE_WEIGHTS.incidents;

    const severityDeductions: Record<string, number> = {
      MINOR: 3, MODERATE: 6, MAJOR: 10, CRITICAL: 15, FATAL: 25,
    };

    const totalDeduction = incidents.reduce(
      (sum, inc) => sum + (severityDeductions[inc.severity] ?? 5),
      0
    );

    return Math.max(0, SCORE_WEIGHTS.incidents - totalDeduction);
  }

  private async calculateHOSScore(driverId: string, since: Date): Promise<number> {
    const count = await this.prisma.hOSViolation.count({
      where: { driverId, violationDate: { gte: since } },
    });

    if (count === 0) return SCORE_WEIGHTS.hosViolations;
    const deduction = count * 3;
    return Math.max(0, SCORE_WEIGHTS.hosViolations - deduction);
  }

  private async calculateMVRScore(driverId: string, since: Date): Promise<number> {
    const violations = await this.prisma.mVRViolation.count({
      where: { mvrRecord: { driverId }, violationDate: { gte: since } },
    });

    if (violations === 0) return SCORE_WEIGHTS.mvrViolations;
    const deduction = violations * 4;
    return Math.max(0, SCORE_WEIGHTS.mvrViolations - deduction);
  }

  private async calculateDrugTestScore(driverId: string, since: Date): Promise<number> {
    const tests = await this.prisma.drugAlcoholTest.findMany({
      where: { driverId, testDate: { gte: since }, deletedAt: null },
      select: { result: true },
    });

    if (tests.length === 0) return SCORE_WEIGHTS.drugTests / 2;
    const hasPositive = tests.some((t) => t.result === 'POSITIVE');
    if (hasPositive) return 0;
    return SCORE_WEIGHTS.drugTests;
  }

  private async calculateInspectionScore(driverId: string, since: Date): Promise<number> {
    const inspections = await this.prisma.roadsideInspection.findMany({
      where: { driverId, inspectionDate: { gte: since }, deletedAt: null },
      select: { outOfService: true, violationsFound: true },
    });

    if (inspections.length === 0) return SCORE_WEIGHTS.inspections;

    const oosCount = inspections.filter((i) => i.outOfService).length;
    const violationCount = inspections.filter((i) => i.violationsFound).length;
    const deduction = oosCount * 5 + violationCount * 2;
    return Math.max(0, SCORE_WEIGHTS.inspections - deduction);
  }

  private async calculateTrainingScore(driverId: string): Promise<number> {
    const trainings = await this.prisma.safetyTraining.findMany({
      where: { driverId, deletedAt: null },
      select: { completed: true, expiryDate: true },
    });

    if (trainings.length === 0) return 0;

    const completedCount = trainings.filter((t) => t.completed).length;
    const expiredCount = trainings.filter(
      (t) => t.expiryDate && this.isExpired(t.expiryDate)
    ).length;

    const completionRatio = completedCount / trainings.length;
    const score = SCORE_WEIGHTS.training * completionRatio;
    const expiredDeduction = expiredCount * 2;
    return Math.max(0, score - expiredDeduction);
  }

  private async calculateCitationScore(driverId: string, since: Date): Promise<number> {
    const count = await this.prisma.citation.count({
      where: { driverId, citationDate: { gte: since }, deletedAt: null },
    });

    if (count === 0) return SCORE_WEIGHTS.citations;
    const deduction = count * 3;
    return Math.max(0, SCORE_WEIGHTS.citations - deduction);
  }
}
