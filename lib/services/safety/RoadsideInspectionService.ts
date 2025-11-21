import { PrismaClient } from '@prisma/client';
import { BaseSafetyService } from './BaseSafetyService';
import { AlertService } from './AlertService';

/**
 * Service for managing Roadside Inspections
 */
export class RoadsideInspectionService extends BaseSafetyService {
  private alertService: AlertService;

  constructor(prisma: PrismaClient, companyId: string, mcNumberId?: string) {
    super(prisma, companyId, mcNumberId);
    this.alertService = new AlertService(prisma, companyId, mcNumberId);
  }

  /**
   * Create roadside inspection and handle OOS
   */
  async createInspection(data: any) {
    try {
      const inspection = await this.prisma.roadsideInspection.create({
        data: {
          ...data,
          companyId: this.companyId,
          mcNumberId: this.mcNumberId,
          violations: {
            create: (data.violations || []).map((violation: any) => ({
              violationCode: violation.violationCode,
              violationDescription: violation.violationDescription,
              severityWeight: violation.severityWeight,
              basicCategory: violation.basicCategory
            }))
          }
        },
        include: {
          violations: true
        }
      });

      // If OOS, create OOS order
      if (inspection.outOfService) {
        if (!this.companyId) throw new Error('Company ID is required');
        await this.prisma.outOfServiceOrder.create({
          data: {
            companyId: this.companyId,
            driverId: data.driverId,
            truckId: data.truckId,
            oosDate: inspection.inspectionDate,
            oosReason: inspection.oosReason || 'Roadside inspection',
            oosType: data.driverId ? 'DRIVER' : 'VEHICLE',
            requiredCorrectiveAction: data.requiredCorrectiveAction,
            inspectorName: inspection.inspectorName,
            inspectorBadgeNumber: inspection.inspectorBadgeNumber,
            inspectionId: inspection.id,
            status: 'ACTIVE'
          }
        });

        // Create alert
        await this.alertService.createAlert({
          companyId: this.companyId!,
          alertType: 'OUT_OF_SERVICE',
          severity: 'HIGH',
          title: `Out of Service: ${data.driverId ? 'Driver' : 'Vehicle'}`,
          message: `Out of service order issued during roadside inspection`,
          relatedEntityType: data.driverId ? 'driver' : 'vehicle',
          relatedEntityId: data.driverId || data.truckId
        });
      }

      // If violations found, create alert
      if (inspection.violationsFound && inspection.violations.length > 0) {
        await this.alertService.createAlert({
          companyId: this.companyId!,
          alertType: 'ROADSIDE_VIOLATION',
          severity: 'MEDIUM',
          title: `Roadside Inspection Violations`,
          message: `${inspection.violations.length} violation(s) found during inspection`,
          relatedEntityType: 'inspection',
          relatedEntityId: inspection.id
        });
      }

      return inspection;
    } catch (error) {
      this.handleError(error, 'Failed to create roadside inspection');
    }
  }

  /**
   * Get inspection statistics
   */
  async getInspectionStats(startDate: Date, endDate: Date) {
    try {
      const inspections = await this.prisma.roadsideInspection.findMany({
        where: {
          ...this.getCompanyFilter(),
          inspectionDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          violations: true
        }
      });

      const total = inspections.length;
      const withViolations = inspections.filter(i => i.violationsFound).length;
      const oosCount = inspections.filter(i => i.outOfService).length;
      const totalViolations = inspections.reduce(
        (sum, i) => sum + i.violations.length,
        0
      );

      return {
        total,
        withViolations,
        oosCount,
        totalViolations,
        violationRate: total > 0 ? (withViolations / total) * 100 : 0,
        oosRate: total > 0 ? (oosCount / total) * 100 : 0
      };
    } catch (error) {
      this.handleError(error, 'Failed to get inspection statistics');
    }
  }
}

