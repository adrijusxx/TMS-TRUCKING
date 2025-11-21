import { PrismaClient } from '@prisma/client';
import { BaseComplianceService } from './BaseComplianceService';
import { AlertService } from './AlertService';

/**
 * Service for managing CDL Records
 */
export class CDLService extends BaseComplianceService {
  private alertService: AlertService;

  constructor(prisma: PrismaClient, companyId?: string, mcNumberId?: string) {
    super(prisma, companyId, mcNumberId);
    this.alertService = new AlertService(prisma, companyId || '', mcNumberId);
  }

  /**
   * Check expiring CDLs and create alerts
   */
  async checkExpiringCDLs(companyId: string, daysThreshold: number = 30) {
    try {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

      const expiringCDLs = await this.prisma.cDLRecord.findMany({
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

      for (const cdl of expiringCDLs) {
        const daysUntil = this.daysUntilExpiration(cdl.expirationDate);
        const severity = daysUntil <= 7 ? 'CRITICAL' : daysUntil <= 15 ? 'HIGH' : 'MEDIUM';

        await this.alertService.createAlert({
          companyId,
          alertType: 'EXPIRING_DOCUMENT',
          severity,
          title: `CDL Expiring: ${cdl.driver.user.firstName} ${cdl.driver.user.lastName}`,
          message: `CDL expires in ${daysUntil} days`,
          relatedEntityType: 'driver',
          relatedEntityId: cdl.driverId
        });

        alerts.push(cdl);
      }

      return { alertsCreated: alerts.length, cdls: alerts };
    } catch (error) {
      this.handleError(error, 'Failed to check expiring CDLs');
    }
  }

  /**
   * Validate CDL is not expired
   */
  async validateCDL(driverId: string): Promise<{ valid: boolean; reason?: string }> {
    try {
      const cdl = await this.prisma.cDLRecord.findUnique({
        where: { driverId }
      });

      if (!cdl) {
        return { valid: false, reason: 'CDL record not found' };
      }

      if (this.isExpired(cdl.expirationDate)) {
        return { valid: false, reason: 'CDL is expired' };
      }

      return { valid: true };
    } catch (error) {
      this.handleError(error, 'Failed to validate CDL');
    }
  }
}

