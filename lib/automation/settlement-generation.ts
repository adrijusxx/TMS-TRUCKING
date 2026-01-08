import { prisma } from '@/lib/prisma';
import { SettlementManager } from '@/lib/managers/SettlementManager';

/**
 * Weekly Settlement Generation Cron Job
 * 
 * Schedule: Every Monday at 12:00 AM
 * Purpose: Automatically generate settlements for all active drivers for the previous week
 * 
 * Usage with cron:
 * - Add to crontab: 0 0 * * 1 node -e "require('./lib/automation/settlement-generation').runWeeklySettlementGeneration()"
 * - Or use PM2 cron: pm2 start settlement-generation.js --cron "0 0 * * 1"
 * - Or use node-cron in your app
 */

interface SettlementGenerationResult {
  success: boolean;
  totalCompanies: number;
  totalDrivers: number;
  settlementsGenerated: number;
  errors: Array<{
    companyId: string;
    driverId?: string;
    error: string;
  }>;
  startTime: Date;
  endTime: Date;
  duration: number;
}

/**
 * Run weekly settlement generation for all companies
 */
export async function runWeeklySettlementGeneration(): Promise<SettlementGenerationResult> {
  const startTime = new Date();
  console.log(`[Settlement Cron] Starting weekly settlement generation at ${startTime.toISOString()}`);

  const errors: Array<{ companyId: string; driverId?: string; error: string }> = [];
  let settlementsGenerated = 0;
  let totalDrivers = 0;

  try {
    // Calculate period (previous week: Monday to Sunday by default)
    // Can be customized via company settings
    const periodEnd = new Date();
    periodEnd.setHours(0, 0, 0, 0);
    periodEnd.setDate(periodEnd.getDate() - periodEnd.getDay()); // Last Sunday

    const periodStart = new Date(periodEnd);
    periodStart.setDate(periodStart.getDate() - 6); // Previous Monday

    console.log(`[Settlement Cron] Period: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);

    // Get all active companies
    const companies = await prisma.company.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`[Settlement Cron] Found ${companies.length} companies`);

    // Process each company
    for (const company of companies) {
      try {
        console.log(`[Settlement Cron] Processing company: ${company.name} (${company.id})`);

        // Get all active drivers for the company
        const drivers = await prisma.driver.findMany({
          where: {
            companyId: company.id,
            status: 'AVAILABLE',
            deletedAt: null,
          },
          select: {
            id: true,
            driverNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        console.log(`[Settlement Cron] Found ${drivers.length} active drivers for ${company.name}`);
        totalDrivers += drivers.length;

        // Generate settlement for each driver
        const settlementManager = new SettlementManager();

        for (const driver of drivers) {
          try {
            // Check if driver has any completed loads in the period
            const loadsCount = await prisma.load.findMany({
              where: {
                driverId: driver.id,
                status: 'DELIVERED',
                deliveredAt: {
                  gte: periodStart,
                  lte: periodEnd,
                },
                deletedAt: null,
              },
              select: { id: true },
            });

            if (loadsCount.length === 0) {
              console.log(
                `[Settlement Cron] Skipping driver ${driver.driverNumber} - no completed loads in period`
              );
              continue;
            }

            // Check if settlement already exists for this period
            const existingSettlement = await prisma.settlement.findFirst({
              where: {
                driverId: driver.id,
                periodStart,
                periodEnd,
              },
            });

            if (existingSettlement) {
              console.log(
                `[Settlement Cron] Skipping driver ${driver.driverNumber} - settlement already exists`
              );
              continue;
            }

            // Generate settlement
            const settlement = await settlementManager.generateSettlement({
              driverId: driver.id,
              periodStart,
              periodEnd,
            });

            settlementsGenerated++;
            console.log(
              `[Settlement Cron] Generated settlement ${settlement.settlementNumber} for driver ${driver.driverNumber}`
            );

            // Send notification to driver
            await sendDriverNotification(driver.id, settlement.id);

            // Send notification to accounting
            await sendAccountingNotification(company.id, settlement.id);
          } catch (error: any) {
            console.error(
              `[Settlement Cron] Error generating settlement for driver ${driver.driverNumber}:`,
              error
            );
            errors.push({
              companyId: company.id,
              driverId: driver.id,
              error: error.message || 'Unknown error',
            });
          }
        }
      } catch (error: any) {
        console.error(`[Settlement Cron] Error processing company ${company.name}:`, error);
        errors.push({
          companyId: company.id,
          error: error.message || 'Unknown error',
        });
      }
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    const result: SettlementGenerationResult = {
      success: errors.length === 0,
      totalCompanies: companies.length,
      totalDrivers,
      settlementsGenerated,
      errors,
      startTime,
      endTime,
      duration,
    };

    console.log(`[Settlement Cron] Completed in ${duration}ms`);
    console.log(`[Settlement Cron] Generated ${settlementsGenerated} settlements`);
    console.log(`[Settlement Cron] Errors: ${errors.length}`);

    // Log to activity log
    await logCronExecution(result);

    return result;
  } catch (error: any) {
    console.error('[Settlement Cron] Fatal error:', error);
    const endTime = new Date();
    return {
      success: false,
      totalCompanies: 0,
      totalDrivers: 0,
      settlementsGenerated: 0,
      errors: [{ companyId: 'SYSTEM', error: error.message || 'Fatal error' }],
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
    };
  }
}

/**
 * Send notification to driver about new settlement
 */
async function sendDriverNotification(driverId: string, settlementId: string): Promise<void> {
  try {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        driver: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!settlement) return;

    await prisma.notification.create({
      data: {
        userId: settlement.driver.userId,
        type: 'SYSTEM_ALERT',
        title: 'New Settlement Available',
        message: `Your settlement ${settlement.settlementNumber} for $${settlement.netPay.toFixed(2)} is ready for review.`,
      },
    });

    console.log(`[Settlement Cron] Sent notification to driver ${settlement.driver.driverNumber}`);
  } catch (error) {
    console.error('[Settlement Cron] Error sending driver notification:', error);
  }
}

/**
 * Send notification to accounting team about new settlement
 */
async function sendAccountingNotification(companyId: string, settlementId: string): Promise<void> {
  try {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        driver: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!settlement) return;

    // Get all accountants and admins for the company
    const accountingUsers = await prisma.user.findMany({
      where: {
        companyId,
        role: {
          in: ['ADMIN', 'ACCOUNTANT'],
        },
        deletedAt: null,
      },
    });

    // Create notification for each accounting user
    await Promise.all(
      accountingUsers.map((user) =>
        prisma.notification.create({
          data: {
            userId: user.id,
            type: 'SYSTEM_ALERT',
            title: 'Settlement Pending Approval',
            message: `Settlement ${settlement.settlementNumber} for ${settlement.driver.user.firstName} ${settlement.driver.user.lastName} ($${settlement.netPay.toFixed(2)}) is pending approval.`,
          },
        })
      )
    );

    console.log(
      `[Settlement Cron] Sent notifications to ${accountingUsers.length} accounting users`
    );
  } catch (error) {
    console.error('[Settlement Cron] Error sending accounting notification:', error);
  }
}

/**
 * Log cron execution to activity log
 */
async function logCronExecution(result: SettlementGenerationResult): Promise<void> {
  try {
    // Get the first company ID from processed companies for the activity log
    // If no companies processed, skip logging
    if (result.totalCompanies === 0) {
      return;
    }

    // Get first company ID (we need at least one company to log)
    const firstCompany = await prisma.company.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    if (!firstCompany) {
      console.warn('[Settlement Cron] No active company found for activity log');
      return;
    }

    await prisma.activityLog.create({
      data: {
        companyId: firstCompany.id,
        action: 'CRON_SETTLEMENT_GENERATION',
        entityType: 'SYSTEM',
        entityId: 'CRON',
        metadata: {
          success: result.success,
          totalCompanies: result.totalCompanies,
          totalDrivers: result.totalDrivers,
          settlementsGenerated: result.settlementsGenerated,
          errorCount: result.errors.length,
          duration: result.duration,
          startTime: result.startTime,
          endTime: result.endTime,
          performedBy: 'SYSTEM',
        },
      },
    });
  } catch (error) {
    console.error('[Settlement Cron] Error logging to activity log:', error);
  }
}

/**
 * Manual trigger endpoint (can be called from API)
 */
export async function triggerManualSettlementGeneration(
  companyId?: string,
  periodStart?: Date,
  periodEnd?: Date
): Promise<SettlementGenerationResult> {
  console.log('[Settlement Cron] Manual trigger initiated');

  if (companyId) {
    // Generate for specific company
    return runSettlementGenerationForCompany(companyId, periodStart, periodEnd);
  }

  // Generate for all companies WITH the provided dates
  return runSettlementGenerationForAllCompanies(periodStart, periodEnd);
}

/**
 * Run settlement generation for ALL companies with custom dates
 */
async function runSettlementGenerationForAllCompanies(
  periodStart?: Date,
  periodEnd?: Date
): Promise<SettlementGenerationResult> {
  const startTime = new Date();
  console.log(`[Settlement Cron] Starting weekly settlement generation at ${startTime.toISOString()}`);

  // Use provided dates or default to previous week
  if (!periodStart || !periodEnd) {
    periodEnd = new Date();
    periodEnd.setHours(0, 0, 0, 0);
    periodEnd.setDate(periodEnd.getDate() - periodEnd.getDay());

    periodStart = new Date(periodEnd);
    periodStart.setDate(periodStart.getDate() - 6);
  }

  console.log(`[Settlement Cron] Period: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);

  const errors: Array<{ companyId: string; driverId?: string; error: string }> = [];
  let settlementsGenerated = 0;
  let totalDrivers = 0;

  try {
    // Get all active companies
    const companies = await prisma.company.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`[Settlement Cron] Found ${companies.length} companies`);

    // Process each company
    for (const company of companies) {
      try {
        console.log(`[Settlement Cron] Processing company: ${company.name} (${company.id})`);

        // Get all active drivers for the company
        const drivers = await prisma.driver.findMany({
          where: {
            companyId: company.id,
            status: 'AVAILABLE',
            deletedAt: null,
          },
          select: {
            id: true,
            driverNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        console.log(`[Settlement Cron] Found ${drivers.length} active drivers for ${company.name}`);
        totalDrivers += drivers.length;

        // Generate settlement for each driver
        const settlementManager = new SettlementManager();

        for (const driver of drivers) {
          try {
            // Check if driver has any completed loads in the period
            const loadsInPeriod = await prisma.load.findMany({
              where: {
                driverId: driver.id,
                status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
                deliveredAt: {
                  gte: periodStart,
                  lte: periodEnd,
                },
                deletedAt: null,
              },
              select: { id: true },
            });

            if (loadsInPeriod.length === 0) {
              console.log(
                `[Settlement Cron] Skipping driver ${driver.driverNumber} - no completed loads in period`
              );
              continue;
            }

            // Check if settlement already exists for this period
            const existingSettlement = await prisma.settlement.findFirst({
              where: {
                driverId: driver.id,
                periodStart,
                periodEnd,
              },
            });

            if (existingSettlement) {
              console.log(
                `[Settlement Cron] Skipping driver ${driver.driverNumber} - settlement already exists`
              );
              continue;
            }

            // Generate settlement
            const settlement = await settlementManager.generateSettlement({
              driverId: driver.id,
              periodStart,
              periodEnd,
            });

            settlementsGenerated++;
            console.log(
              `[Settlement Cron] Generated settlement ${settlement.settlementNumber} for driver ${driver.driverNumber}`
            );

            // Send notification to driver
            await sendDriverNotification(driver.id, settlement.id);

            // Send notification to accounting
            await sendAccountingNotification(company.id, settlement.id);
          } catch (error: any) {
            console.error(
              `[Settlement Cron] Error generating settlement for driver ${driver.driverNumber}:`,
              error
            );
            errors.push({
              companyId: company.id,
              driverId: driver.id,
              error: error.message || 'Unknown error',
            });
          }
        }
      } catch (error: any) {
        console.error(`[Settlement Cron] Error processing company ${company.name}:`, error);
        errors.push({
          companyId: company.id,
          error: error.message || 'Unknown error',
        });
      }
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    const result: SettlementGenerationResult = {
      success: errors.length === 0,
      totalCompanies: companies.length,
      totalDrivers,
      settlementsGenerated,
      errors,
      startTime,
      endTime,
      duration,
    };

    console.log(`[Settlement Cron] Completed in ${duration}ms`);
    console.log(`[Settlement Cron] Generated ${settlementsGenerated} settlements`);
    console.log(`[Settlement Cron] Errors: ${errors.length}`);

    // Log to activity log
    await logCronExecution(result);

    return result;
  } catch (error: any) {
    console.error('[Settlement Cron] Fatal error:', error);
    const endTime = new Date();
    return {
      success: false,
      totalCompanies: 0,
      totalDrivers: 0,
      settlementsGenerated: 0,
      errors: [{ companyId: 'SYSTEM', error: error.message || 'Fatal error' }],
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
    };
  }
}

/**
 * Run settlement generation for a specific company
 */
async function runSettlementGenerationForCompany(
  companyId: string,
  periodStart?: Date,
  periodEnd?: Date
): Promise<SettlementGenerationResult> {
  const startTime = new Date();

  // Use provided dates or default to previous week
  if (!periodStart || !periodEnd) {
    periodEnd = new Date();
    periodEnd.setHours(0, 0, 0, 0);
    periodEnd.setDate(periodEnd.getDate() - periodEnd.getDay());

    periodStart = new Date(periodEnd);
    periodStart.setDate(periodStart.getDate() - 6);
  }

  const errors: Array<{ companyId: string; driverId?: string; error: string }> = [];
  let settlementsGenerated = 0;

  try {
    const drivers = await prisma.driver.findMany({
      where: {
        companyId,
        isActive: true,
        deletedAt: null,
      },
    });

    const settlementManager = new SettlementManager();

    for (const driver of drivers) {
      try {
        const settlement = await settlementManager.generateSettlement({
          driverId: driver.id,
          periodStart,
          periodEnd,
        });

        settlementsGenerated++;
        await sendDriverNotification(driver.id, settlement.id);
        await sendAccountingNotification(companyId, settlement.id);
      } catch (error: any) {
        errors.push({
          companyId,
          driverId: driver.id,
          error: error.message || 'Unknown error',
        });
      }
    }

    const endTime = new Date();
    return {
      success: errors.length === 0,
      totalCompanies: 1,
      totalDrivers: drivers.length,
      settlementsGenerated,
      errors,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
    };
  } catch (error: any) {
    const endTime = new Date();
    return {
      success: false,
      totalCompanies: 1,
      totalDrivers: 0,
      settlementsGenerated: 0,
      errors: [{ companyId, error: error.message || 'Unknown error' }],
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
    };
  }
}

