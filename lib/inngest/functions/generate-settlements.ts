/**
 * Generate Settlements Background Function
 * 
 * Handles automated settlement generation without blocking the main thread.
 * Triggered by: Cron (Weekly Friday 12pm) or Manual Button
 * 
 * @see docs/specs/OPERATIONAL_OVERHAUL.MD Section 3.2
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { SettlementManager } from '@/lib/managers/SettlementManager';

/**
 * Weekly settlement generation for all companies
 * Cron: Every Friday at 12:00 PM (0 12 * * FRI)
 */
export const generateAllSettlements = inngest.createFunction(
  {
    id: 'generate-all-settlements',
    name: 'Generate All Settlements (Weekly)',
    concurrency: {
      limit: 1, // Only one instance at a time
    },
    retries: 2,
  },
  { cron: '0 12 * * FRI' }, // Every Friday at noon
  async ({ event, step, logger }) => {
    logger.info('Starting weekly settlement generation');

    // Step 1: Calculate period (previous week)
    const { periodStart, periodEnd } = await step.run('calculate-period', () => {
      const end = new Date();
      end.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - end.getDay()); // Last Sunday

      const start = new Date(end);
      start.setDate(start.getDate() - 6); // Previous Monday

      return {
        periodStart: start.toISOString(),
        periodEnd: end.toISOString()
      };
    });

    // Step 2: Get all active companies
    const companies = await step.run('fetch-companies', async () => {
      return prisma.company.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });
    });

    logger.info(`Found ${companies.length} active companies`);

    // Step 3: Process each company (fan-out pattern)
    const results = await Promise.all(
      companies.map((company) =>
        step.run(`process-company-${company.id}`, async () => {
          return processCompanySettlements(
            company.id,
            new Date(periodStart),
            new Date(periodEnd),
            logger
          );
        })
      )
    );

    // Step 4: Aggregate results
    const summary = {
      totalCompanies: companies.length,
      totalDriversProcessed: results.reduce((sum, r) => sum + r.driversProcessed, 0),
      settlementsGenerated: results.reduce((sum, r) => sum + r.settlementsGenerated, 0),
      errors: results.flatMap((r) => r.errors),
    };

    // Step 5: Log to activity log
    await step.run('log-execution', async () => {
      if (companies.length > 0) {
        await prisma.activityLog.create({
          data: {
            companyId: companies[0].id,
            action: 'INNGEST_SETTLEMENT_GENERATION',
            entityType: 'SYSTEM',
            entityId: 'INNGEST',
            metadata: {
              ...summary,
              periodStart,
              periodEnd,
              triggeredBy: 'cron',
            },
          },
        });
      }
    });

    logger.info(`Completed: ${summary.settlementsGenerated} settlements generated`);

    return summary;
  }
);

/**
 * Generate settlements for a specific company (manual trigger)
 */
export const generateCompanySettlements = inngest.createFunction(
  {
    id: 'generate-company-settlements',
    name: 'Generate Company Settlements',
    retries: 2,
  },
  { event: 'settlement/generate-for-company' },
  async ({ event, step, logger }) => {
    const { companyId, periodStart, periodEnd } = event.data;

    logger.info(`Starting settlement generation for company ${companyId}`);

    // Calculate period if not provided
    const period = await step.run('calculate-period', () => {
      if (periodStart && periodEnd) {
        return { start: new Date(periodStart), end: new Date(periodEnd) };
      }

      const end = new Date();
      end.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - end.getDay());

      const start = new Date(end);
      start.setDate(start.getDate() - 6);

      return { start, end };
    });

    // Process the company
    const result = await step.run('process-settlements', async () => {
      const startDate = typeof period.start === 'string' ? new Date(period.start) : period.start;
      const endDate = typeof period.end === 'string' ? new Date(period.end) : period.end;
      return processCompanySettlements(
        companyId,
        startDate,
        endDate,
        logger
      );
    });

    // Log execution
    await step.run('log-execution', async () => {
      await prisma.activityLog.create({
        data: {
          companyId,
          action: 'INNGEST_SETTLEMENT_GENERATION',
          entityType: 'SYSTEM',
          entityId: 'INNGEST',
          metadata: {
            ...result,
            periodStart: typeof period.start === 'string' ? period.start : (period.start as Date).toISOString(),
            periodEnd: typeof period.end === 'string' ? period.end : (period.end as Date).toISOString(),
            triggeredBy: 'manual',
          },
        },
      });
    });

    return result;
  }
);

/**
 * Generate settlement for a single driver
 */
export const generateDriverSettlement = inngest.createFunction(
  {
    id: 'generate-driver-settlement',
    name: 'Generate Driver Settlement',
    retries: 3,
  },
  { event: 'settlement/generate-for-driver' },
  async ({ event, step, logger }) => {
    const { driverId, periodStart, periodEnd } = event.data;

    logger.info(`Generating settlement for driver ${driverId}`);

    const settlementManager = new SettlementManager();

    const settlement = await step.run('generate-settlement', async () => {
      return settlementManager.generateSettlement({
        driverId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
      });
    });

    // Send notifications
    await step.run('send-notifications', async () => {
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        include: { user: true },
      });

      if (driver && driver.userId) {
        // Notify driver
        await prisma.notification.create({
          data: {
            userId: driver.userId,
            type: 'SYSTEM_ALERT',
            title: 'New Settlement Available',
            message: `Settlement ${settlement.settlementNumber} for $${settlement.netPay.toFixed(2)} is ready.`,
          },
        });
      }
    });

    return {
      settlementId: settlement.id,
      settlementNumber: settlement.settlementNumber,
      netPay: settlement.netPay,
    };
  }
);

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

interface ProcessResult {
  companyId: string;
  driversProcessed: number;
  settlementsGenerated: number;
  errors: Array<{ driverId: string; error: string }>;
}

export async function processCompanySettlements(
  companyId: string,
  periodStart: Date,
  periodEnd: Date,
  logger: { info: (msg: string) => void; error: (msg: string, e?: unknown) => void }
): Promise<ProcessResult> {
  const errors: Array<{ driverId: string; error: string }> = [];
  let settlementsGenerated = 0;

  // Get active drivers for company
  const drivers = await prisma.driver.findMany({
    where: {
      companyId,
      status: 'AVAILABLE',
      deletedAt: null,
    },
    select: {
      id: true,
      driverNumber: true,
    },
  });

  const settlementManager = new SettlementManager();

  for (const driver of drivers) {
    try {
      // Check for completed loads in period
      const loadsCount = await prisma.load.count({
        where: {
          driverId: driver.id,
          status: 'DELIVERED',
          deliveredAt: { gte: periodStart, lte: periodEnd },
          readyForSettlement: true,
          deletedAt: null,
        },
      });

      if (loadsCount === 0) {
        logger.info(`Skipping ${driver.driverNumber} - no loads`);
        continue;
      }

      // Check for existing settlement
      const existing = await prisma.settlement.findFirst({
        where: {
          driverId: driver.id,
          periodStart,
          periodEnd,
        },
      });

      if (existing) {
        logger.info(`Skipping ${driver.driverNumber} - settlement exists`);
        continue;
      }

      // Generate settlement
      const settlement = await settlementManager.generateSettlement({
        driverId: driver.id,
        periodStart,
        periodEnd,
      });

      settlementsGenerated++;
      logger.info(`Generated ${settlement.settlementNumber} for ${driver.driverNumber}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push({ driverId: driver.id, error: message });
      logger.error(`Error for ${driver.driverNumber}: ${message}`);
    }
  }

  return {
    companyId,
    driversProcessed: drivers.length,
    settlementsGenerated,
    errors,
  };
}



