import { PrismaClient } from '@prisma/client';
import { BaseComplianceService } from './BaseComplianceService';
import { AlertService } from './AlertService';

/**
 * Service for managing Medical Cards
 */
export class MedicalCardService extends BaseComplianceService {
  private alertService: AlertService;

  constructor(prisma: PrismaClient, companyId?: string, mcNumberId?: string) {
    super(prisma, companyId, mcNumberId);
    this.alertService = new AlertService(prisma, companyId || '', mcNumberId);
  }

  /**
   * Check expiring medical cards and create alerts
   */
  async checkExpiringMedicalCards(companyId: string, daysThreshold: number = 30) {
    try {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

      const expiringCards = await this.prisma.medicalCard.findMany({
        where: {
          companyId,
          expirationDate: {
            lte: thresholdDate,
            gte: new Date()
          }
        },
        include: {
          driver: {
            include: {
              user: true
            }
          }
        }
      });

      const alerts = [];

      for (const card of expiringCards) {
        const daysUntil = this.daysUntilExpiration(card.expirationDate);
        const severity = daysUntil <= 7 ? 'CRITICAL' : daysUntil <= 15 ? 'HIGH' : 'MEDIUM';

        await this.alertService.createAlert({
          companyId,
          alertType: 'EXPIRING_DOCUMENT',
          severity,
          title: `Medical Card Expiring: ${card.driver.user.firstName} ${card.driver.user.lastName}`,
          message: `Medical card expires in ${daysUntil} days`,
          relatedEntityType: 'driver',
          relatedEntityId: card.driverId
        });

        alerts.push(card);
      }

      return { alertsCreated: alerts.length, cards: alerts };
    } catch (error) {
      console.error('Failed to check expiring medical cards:', error);
      throw error;
    }
  }

  /**
   * Get expiring medical cards
   */
  async getExpiringMedicalCards(companyId: string, days: number = 30) {
    try {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + days);

      return await this.prisma.medicalCard.findMany({
        where: {
          companyId,
          expirationDate: {
            lte: thresholdDate,
            gte: new Date()
          }
        },
        include: {
          driver: {
            include: {
              user: true
            }
          },
          document: true
        },
        orderBy: { expirationDate: 'asc' }
      });
    } catch (error) {
      this.handleError(error, 'Failed to get expiring medical cards');
    }
  }
}

