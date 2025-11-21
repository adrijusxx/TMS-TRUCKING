import { PrismaClient } from '@prisma/client';
import { BaseSafetyService } from './BaseSafetyService';
import { AlertService } from './AlertService';

/**
 * Service for managing Safety Incidents
 */
export class IncidentService extends BaseSafetyService {
  private alertService: AlertService;

  constructor(prisma: PrismaClient, companyId: string, mcNumberId?: string) {
    super(prisma, companyId, mcNumberId);
    this.alertService = new AlertService(prisma, companyId, mcNumberId);
  }

  /**
   * Create incident and trigger alerts if needed
   */
  async createIncident(data: any) {
    try {
      const incident = await this.prisma.safetyIncident.create({
        data: {
          ...data,
          companyId: this.companyId,
          mcNumberId: this.mcNumberId
        }
      });

      // Create alert for serious incidents
      if (data.severity === 'CRITICAL' || data.fatalitiesInvolved || data.injuriesInvolved) {
        if (!this.companyId) throw new Error('Company ID is required');
        await this.alertService.createAlert({
          companyId: this.companyId,
          alertType: 'INCIDENT',
          severity: data.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          title: `Safety Incident: ${data.incidentType}`,
          message: `Incident ${data.incidentNumber} reported with severity: ${data.severity}`,
          relatedEntityType: 'incident',
          relatedEntityId: incident.id
        });
      }

      return incident;
    } catch (error) {
      this.handleError(error, 'Failed to create incident');
    }
  }

  /**
   * Calculate accident frequency rate
   */
  async calculateAccidentFrequencyRate(startDate: Date, endDate: Date): Promise<number> {
    try {
      const totalIncidents = await this.prisma.safetyIncident.count({
        where: {
          ...this.getCompanyFilter(),
          incidentType: 'ACCIDENT',
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalMiles = await this.prisma.load.aggregate({
        _sum: {
          totalMiles: true
        },
        where: {
          ...this.getCompanyFilter(),
          deliveryDate: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const miles = totalMiles._sum.totalMiles || 0;

      if (miles === 0) return 0;

      // Accidents per million miles
      return (totalIncidents / miles) * 1_000_000;
    } catch (error) {
      this.handleError(error, 'Failed to calculate accident frequency rate');
    }
  }

  /**
   * Get days since last accident
   */
  async getDaysSinceLastAccident(): Promise<number | null> {
    try {
      const lastAccident = await this.prisma.safetyIncident.findFirst({
        where: {
          ...this.getCompanyFilter(),
          incidentType: 'ACCIDENT'
        },
        orderBy: { date: 'desc' }
      });

      if (!lastAccident) return null;

      const now = new Date();
      const diffTime = now.getTime() - lastAccident.date.getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      this.handleError(error, 'Failed to get days since last accident');
    }
  }
}

