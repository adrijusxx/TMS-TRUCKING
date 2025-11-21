import { PrismaClient } from '@prisma/client';
import { BaseComplianceService } from './BaseComplianceService';

/**
 * Service for managing MVR Records
 */
export class MVRService extends BaseComplianceService {
  constructor(prisma: PrismaClient, companyId?: string, mcNumberId?: string) {
    super(prisma, companyId, mcNumberId);
  }
  /**
   * Compare two MVR records to find new violations
   */
  async compareMVRs(driverId: string, currentMVRId: string, previousMVRId: string) {
    try {
      const [current, previous] = await Promise.all([
        this.prisma.mVRRecord.findUnique({
          where: { id: currentMVRId },
          include: { violations: true }
        }),
        this.prisma.mVRRecord.findUnique({
          where: { id: previousMVRId },
          include: { violations: true }
        })
      ]);

      if (!current || !previous) {
        throw new Error('MVR records not found');
      }

      // Find violations in current that weren't in previous
      const previousViolationCodes = new Set(
        previous.violations.map(v => v.violationCode)
      );

      const newViolations = current.violations.filter(
        v => !previousViolationCodes.has(v.violationCode)
      );

      // Mark new violations
      for (const violation of newViolations) {
        await this.prisma.mVRViolation.update({
          where: { id: violation.id },
          data: { isNew: true }
        });
      }

      return {
        newViolations: newViolations.length,
        violations: newViolations
      };
    } catch (error) {
      this.handleError(error, 'Failed to compare MVRs');
    }
  }

  /**
   * Get MVR due dates
   */
  async getMVRDueDates(companyId: string) {
    try {
      const today = new Date();
      const next30Days = new Date();
      next30Days.setDate(today.getDate() + 30);

      const dueMVRs = await this.prisma.mVRRecord.findMany({
        where: {
          companyId,
          nextPullDueDate: {
            lte: next30Days,
            gte: today
          }
        },
        include: {
          driver: {
            include: {
              user: true
            }
          }
        },
        orderBy: { nextPullDueDate: 'asc' }
      });

      return dueMVRs;
    } catch (error) {
      this.handleError(error, 'Failed to get MVR due dates');
    }
  }
}

