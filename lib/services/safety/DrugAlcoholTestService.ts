import { PrismaClient } from '@prisma/client';
import { BaseComplianceService } from './BaseComplianceService';
import { AlertService } from './AlertService';

/**
 * Service for managing Drug & Alcohol Testing
 */
export class DrugAlcoholTestService extends BaseComplianceService {
  private alertService: AlertService;

  constructor(prisma: PrismaClient, companyId?: string, mcNumberId?: string) {
    super(prisma, companyId, mcNumberId);
    this.alertService = new AlertService(prisma, companyId || '', mcNumberId);
  }

  /**
   * Generate random selection for testing pool
   */
  async generateRandomSelection(
    companyId: string,
    poolType: 'DRUG' | 'ALCOHOL',
    quarter: number,
    year: number
  ) {
    try {
      // Get or create pool
      let pool = await this.prisma.testingPool.findUnique({
        where: {
          companyId_poolType_quarter_year: {
            companyId,
            poolType,
            quarter,
            year
          }
        },
        include: {
          drivers: {
            where: { isEligible: true },
            include: { driver: true }
          }
        }
      });

      if (!pool) {
        // Create pool with all eligible drivers
        const eligibleDrivers = await this.prisma.driver.findMany({
          where: {
            companyId,
            employeeStatus: 'ACTIVE',
            deletedAt: null
          }
        });

        pool = await this.prisma.testingPool.create({
          data: {
            companyId,
            poolType,
            quarter,
            year,
            drivers: {
              create: eligibleDrivers.map(driver => ({
                driverId: driver.id,
                isEligible: true
              }))
            }
          },
          include: {
            drivers: {
              where: { isEligible: true },
              include: { driver: true }
            }
          }
        });
      }

      // Calculate selection percentage
      const percentage = poolType === 'DRUG' ? 0.50 : 0.10;
      const eligibleCount = pool.drivers.length;
      const selectionCount = Math.ceil(eligibleCount * percentage);

      // Fisher-Yates shuffle for random selection
      const shuffled = [...pool.drivers];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const selected = shuffled.slice(0, selectionCount);

      // Create selection record
      const selection = await this.prisma.randomSelection.create({
        data: {
          companyId,
          poolId: pool.id,
          selectionDate: new Date(),
          selectionMethod: 'FISHER_YATES_SHUFFLE',
          selectedDrivers: {
            create: selected.map(d => ({
              driverId: d.driverId
            }))
          }
        },
        include: {
          selectedDrivers: {
            include: {
              driver: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });

      return {
        selection,
        poolSize: eligibleCount,
        selectedCount: selectionCount,
        percentage: percentage * 100
      };
    } catch (error) {
      this.handleError(error, 'Failed to generate random selection');
    }
  }

  /**
   * Check for missed drug tests
   */
  async checkMissedTests(companyId: string) {
    try {
      // Get selections from last 90 days that haven't been completed
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const incompleteSelections = await this.prisma.randomSelectedDriver.findMany({
        where: {
          selection: {
            companyId,
            selectionDate: {
              gte: ninetyDaysAgo
            }
          },
          testCompletedAt: null
        },
        include: {
          driver: {
            include: {
              user: true
            }
          },
          selection: {
            include: {
              pool: true
            }
          }
        }
      });

      const alerts = [];

      for (const selected of incompleteSelections) {
        await this.alertService.createAlert({
          companyId,
          alertType: 'MISSED_DRUG_TEST',
          severity: 'HIGH',
          title: `Missed Drug Test: ${selected.driver.user.firstName} ${selected.driver.user.lastName}`,
          message: `Driver was selected for ${selected.selection.pool.poolType} testing but test not completed`,
          relatedEntityType: 'driver',
          relatedEntityId: selected.driverId
        });

        alerts.push(selected);
      }

      return { alertsCreated: alerts.length, missedTests: alerts };
    } catch (error) {
      this.handleError(error, 'Failed to check missed tests');
    }
  }
}

