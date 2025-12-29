import { PrismaClient } from '@prisma/client';
import { BaseComplianceService } from './BaseComplianceService';

/**
 * Service for calculating compliance metrics and CSA scores
 */
export class ComplianceCalculatorService extends BaseComplianceService {
  constructor(prisma: PrismaClient, companyId?: string, mcNumberId?: string) {
    super(prisma, companyId, mcNumberId);
  }
  /**
   * Calculate driver compliance percentage
   */
  async calculateDriverCompliance(driverId: string): Promise<number> {
    try {
      const driver = await this.prisma.driver.findUnique({
        where: { id: driverId },
        include: {
          dqf: {
            include: { documents: true }
          },
          medicalCards: true,
          cdlRecord: true,
          mvrRecords: true,
          drugAlcoholTests: {
            where: {
              testDate: {
                gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
              }
            }
          }
        }
      });

      if (!driver) return 0;

      let score = 0;
      let total = 0;

      // DQF completeness
      if (driver.dqf) {
        total += 1;
        if (driver.dqf.status === 'COMPLETE') score += 1;
      }

      // Medical card
      total += 1;
      const validMedicalCard = driver.medicalCards.some(card => 
        card.expirationDate > new Date()
      );
      if (validMedicalCard) score += 1;

      // CDL
      total += 1;
      if (driver.cdlRecord && driver.cdlRecord.expirationDate > new Date()) {
        score += 1;
      }

      // MVR
      total += 1;
      const recentMVR = driver.mvrRecords.find(mvr => {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return mvr.pullDate >= oneYearAgo;
      });
      if (recentMVR) score += 1;

      // Drug testing
      total += 1;
      const requiredTests = driver.drugAlcoholTests.filter(test => 
        test.testType === 'RANDOM' || test.testType === 'PRE_EMPLOYMENT'
      );
      if (requiredTests.length > 0) score += 1;

      return total > 0 ? (score / total) * 100 : 0;
    } catch (error) {
      this.handleError(error, 'Failed to calculate driver compliance');
    }
  }

  /**
   * Calculate CSA score impact from violations
   */
  calculateViolationImpact(violations: Array<{ severityWeight?: number; basicCategory: string }>): Record<string, number> {
    const impact: Record<string, number> = {};

    for (const violation of violations) {
      const category = violation.basicCategory;
      const weight = violation.severityWeight || 1;

      if (!impact[category]) {
        impact[category] = 0;
      }

      impact[category] += weight;
    }

    return impact;
  }

  /**
   * Calculate days since last accident
   */
  async calculateDaysSinceLastAccident(companyId: string): Promise<number | null> {
    try {
      const lastAccident = await this.prisma.safetyIncident.findFirst({
        where: {
          companyId,
          incidentType: 'ACCIDENT',
          deletedAt: null
        },
        orderBy: { date: 'desc' }
      });

      if (!lastAccident) return null;

      const today = new Date();
      const diffTime = today.getTime() - lastAccident.date.getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      this.handleError(error, 'Failed to calculate days since last accident');
    }
  }
}

