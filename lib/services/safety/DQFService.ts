import { PrismaClient } from '@prisma/client';
import { BaseComplianceService } from './BaseComplianceService';

/**
 * Service for managing Driver Qualification Files
 */
export class DQFService extends BaseComplianceService {
  constructor(prisma: PrismaClient, companyId?: string, mcNumberId?: string) {
    super(prisma, companyId, mcNumberId);
  }
  /**
   * Get or create DQF for driver
   */
  async getOrCreateDQF(driverId: string, companyId: string) {
    try {
      let dqf = await this.prisma.driverQualificationFile.findUnique({
        where: { driverId },
        include: {
          documents: {
            include: {
              document: true
            }
          }
        }
      });

      if (!dqf) {
        dqf = await this.prisma.driverQualificationFile.create({
          data: {
            companyId,
            driverId,
            status: 'INCOMPLETE'
          },
          include: {
            documents: {
              include: {
                document: true
              }
            }
          }
        });
      }

      return dqf;
    } catch (error) {
      console.error('Failed to get or create DQF:', error);
      throw error;
    }
  }

  /**
   * Calculate DQF status based on documents
   */
  async calculateDQFStatus(dqfId: string): Promise<'COMPLETE' | 'INCOMPLETE' | 'EXPIRING' | 'EXPIRED'> {
    try {
      const documents = await this.prisma.dQFDocument.findMany({
        where: { dqfId }
      });

      const requiredTypes = [
        'APPLICATION',
        'ROAD_TEST',
        'PREVIOUS_EMPLOYMENT_VERIFICATION',
        'ANNUAL_REVIEW',
        'MEDICAL_EXAMINERS_CERTIFICATE',
        'CDL_COPY',
        'MVR_RECORD'
      ];

      // Check for missing required documents
      const hasMissing = requiredTypes.some(type =>
        !documents.find(doc => doc.documentType === type && doc.status === 'COMPLETE')
      );

      if (hasMissing) return 'INCOMPLETE';

      // Check for expired documents
      const hasExpired = documents.some(doc => {
        if (!doc.expirationDate) return false;
        return this.isExpired(doc.expirationDate);
      });

      if (hasExpired) return 'EXPIRED';

      // Check for expiring documents
      const hasExpiring = documents.some(doc => {
        if (!doc.expirationDate) return false;
        return this.isExpiringSoon(doc.expirationDate);
      });

      if (hasExpiring) return 'EXPIRING';

      return 'COMPLETE';
    } catch (error) {
      this.handleError(error, 'Failed to calculate DQF status');
    }
  }

  /**
   * Update DQF status
   */
  async updateDQFStatus(dqfId: string) {
    try {
      const status = await this.calculateDQFStatus(dqfId);
      await this.prisma.driverQualificationFile.update({
        where: { id: dqfId },
        data: { status }
      });
      return status;
    } catch (error) {
      this.handleError(error, 'Failed to update DQF status');
    }
  }
}

