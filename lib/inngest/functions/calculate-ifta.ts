/**
 * IFTA Calculation Background Functions
 * 
 * Handles IFTA calculations in the background to prevent timeouts.
 * 
 * @see docs/specs/OPERATIONAL_OVERHAUL.MD Section 4
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { iftaCalculatorService } from '@/lib/services/IFTACalculatorService';

/**
 * Calculate IFTA for all loads in a quarter
 * Triggered by: Cron (End of quarter) or Manual Button
 */
export const calculateQuarterlyIFTA = inngest.createFunction(
  {
    id: 'calculate-quarterly-ifta',
    name: 'Calculate Quarterly IFTA',
    concurrency: { limit: 1 },
    retries: 2,
  },
  { event: 'ifta/calculate-quarter' },
  async ({ event, step, logger }) => {
    const { companyId, quarter, year } = event.data;

    logger.info(`Starting IFTA calculation for Q${quarter} ${year}`);

    // Step 1: Get period dates
    const period = await step.run('get-period', () => {
      const monthMap: Record<number, number> = { 1: 0, 2: 3, 3: 6, 4: 9 };
      const start = new Date(year, monthMap[quarter], 1);
      const end = new Date(year, monthMap[quarter] + 3, 0);
      return { start, end };
    });

    // Step 2: Get all loads in the period
    const loads = await step.run('fetch-loads', async () => {
      return prisma.load.findMany({
        where: {
          companyId,
          deletedAt: null,
          driverId: { not: null },
          OR: [
            { deliveredAt: { gte: period.start, lte: period.end } },
            { deliveryDate: { gte: period.start, lte: period.end } },
          ],
        },
        select: {
          id: true,
          loadNumber: true,
          iftaEntry: { select: { id: true, isCalculated: true } },
        },
      });
    });

    logger.info(`Found ${loads.length} loads in Q${quarter} ${year}`);

    // Step 3: Calculate IFTA for each load that doesn't have an entry
    let calculated = 0;
    let errors = 0;

    for (const load of loads) {
      if (load.iftaEntry?.isCalculated) {
        logger.info(`Skipping ${load.loadNumber} - already calculated`);
        continue;
      }

      try {
        await step.run(`calculate-${load.id}`, async () => {
          await iftaCalculatorService.calculateAndStoreForLoad(
            load.id,
            companyId,
            quarter,
            year
          );
        });
        calculated++;
        logger.info(`Calculated IFTA for ${load.loadNumber}`);
      } catch (error) {
        errors++;
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error calculating IFTA for ${load.loadNumber}: ${message}`);
      }
    }

    // Step 4: Generate summary report
    const report = await step.run('generate-report', async () => {
      return iftaCalculatorService.generateQuarterlyReport(
        companyId,
        quarter,
        year
      );
    });

    // Step 5: Log execution
    await step.run('log-execution', async () => {
      await prisma.activityLog.create({
        data: {
          companyId,
          action: 'IFTA_QUARTERLY_CALCULATION',
          entityType: 'IFTA',
          entityId: `Q${quarter}-${year}`,
          metadata: {
            quarter,
            year,
            loadsProcessed: loads.length,
            calculated,
            errors,
            totalMiles: report.totalMiles,
            totalTax: report.totalTaxDue,
            stateCount: report.stateBreakdown.length,
          },
        },
      });
    });

    logger.info(`Completed: ${calculated} calculated, ${errors} errors`);

    return {
      quarter,
      year,
      loadsProcessed: loads.length,
      calculated,
      errors,
      report: {
        totalMiles: report.totalMiles,
        totalTax: report.totalTaxDue,
        stateCount: report.stateBreakdown.length,
      },
    };
  }
);

/**
 * Calculate IFTA for a single load (on delivery)
 */
export const calculateLoadIFTA = inngest.createFunction(
  {
    id: 'calculate-load-ifta',
    name: 'Calculate Load IFTA',
    retries: 3,
  },
  { event: 'load/delivered' },
  async ({ event, step, logger }) => {
    const { loadId, companyId } = event.data;

    logger.info(`Calculating IFTA for load ${loadId}`);

    // Determine quarter from delivery date
    const load = await step.run('fetch-load', async () => {
      return prisma.load.findUnique({
        where: { id: loadId },
        select: { deliveredAt: true, deliveryDate: true },
      });
    });

    if (!load) {
      throw new Error(`Load ${loadId} not found`);
    }

    const deliveryDate = load.deliveredAt || load.deliveryDate || new Date();
    const date = deliveryDate instanceof Date ? deliveryDate : new Date(deliveryDate);
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    const year = date.getFullYear();

    // Calculate and store
    const entryId = await step.run('calculate', async () => {
      return iftaCalculatorService.calculateAndStoreForLoad(
        loadId,
        companyId,
        quarter,
        year
      );
    });

    logger.info(`Created IFTA entry ${entryId}`);

    return { loadId, entryId, quarter, year };
  }
);



