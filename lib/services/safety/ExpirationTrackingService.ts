import { PrismaClient } from '@prisma/client';
import { BaseComplianceService } from './BaseComplianceService';
import { AlertService } from './AlertService';

/**
 * Service for tracking document and credential expirations
 */
export class ExpirationTrackingService extends BaseComplianceService {
  private alertService: AlertService;

  constructor(prisma: PrismaClient, companyId?: string, mcNumberId?: string) {
    super(prisma, companyId, mcNumberId);
    this.alertService = new AlertService(prisma, companyId || '', mcNumberId);
  }

  /**
   * Check all expiring documents and create alerts
   */
  async checkExpirations(companyId: string) {
    try {
      const alerts: any[] = [];

      // Check medical cards
      const expiringMedicalCards = await this.prisma.medicalCard.findMany({
        where: {
          companyId,
          expirationDate: {
            lte: this.getDateInDays(30),
            gte: new Date()
          }
        },
        include: { driver: { include: { user: true } } }
      });

      for (const card of expiringMedicalCards) {
        const daysUntil = this.daysUntilExpiration(card.expirationDate);
        alerts.push({
          companyId,
          alertType: 'EXPIRING_DOCUMENT',
          severity: daysUntil <= 7 ? 'CRITICAL' : daysUntil <= 15 ? 'HIGH' : 'MEDIUM',
          title: `Medical Card Expiring: ${card.driver.user.firstName} ${card.driver.user.lastName}`,
          message: `Medical card expires in ${daysUntil} days`,
          relatedEntityType: 'driver',
          relatedEntityId: card.driverId
        });
      }

      // Check CDL records
      const expiringCDLs = await this.prisma.cDLRecord.findMany({
        where: {
          companyId,
          expirationDate: {
            lte: this.getDateInDays(30),
            gte: new Date()
          }
        },
        include: { driver: { include: { user: true } } }
      });

      for (const cdl of expiringCDLs) {
        const daysUntil = this.daysUntilExpiration(cdl.expirationDate);
        alerts.push({
          companyId,
          alertType: 'EXPIRING_DOCUMENT',
          severity: daysUntil <= 7 ? 'CRITICAL' : daysUntil <= 15 ? 'HIGH' : 'MEDIUM',
          title: `CDL Expiring: ${cdl.driver.user.firstName} ${cdl.driver.user.lastName}`,
          message: `CDL expires in ${daysUntil} days`,
          relatedEntityType: 'driver',
          relatedEntityId: cdl.driverId
        });
      }

      // Check training expirations
      const expiringTraining = await this.prisma.safetyTraining.findMany({
        where: {
          companyId,
          expiryDate: {
            lte: this.getDateInDays(30),
            gte: new Date()
          }
        },
        include: { driver: { include: { user: true } } }
      });

      for (const training of expiringTraining) {
        if (training.expiryDate) {
          const daysUntil = this.daysUntilExpiration(training.expiryDate);
          alerts.push({
            companyId,
            alertType: 'EXPIRING_DOCUMENT',
            severity: daysUntil <= 7 ? 'CRITICAL' : daysUntil <= 15 ? 'HIGH' : 'MEDIUM',
            title: `Training Expiring: ${training.driver.user.firstName} ${training.driver.user.lastName}`,
            message: `${training.trainingName} expires in ${daysUntil} days`,
            relatedEntityType: 'driver',
            relatedEntityId: training.driverId
          });
        }
      }

      // Create alerts
      for (const alertData of alerts) {
        await this.alertService.createAlert(alertData);
      }

      return { alertsCreated: alerts.length };
    } catch (error) {
      this.handleError(error, 'Failed to check expirations');
    }
  }

  /**
   * Get date N days from now
   */
  private getDateInDays(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}

