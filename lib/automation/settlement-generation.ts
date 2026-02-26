/**
 * Settlement Generation Automation
 *
 * Generates settlements for drivers across companies.
 * Used by weekly cron job and manual trigger API.
 */

import { prisma } from '@/lib/prisma';
import { SettlementManager } from '@/lib/managers/SettlementManager';
import { logger } from '@/lib/utils/logger';
import { sendDriverNotification, sendAccountingNotification } from './settlement-notifications';
import { logCronExecution } from './settlement-cron-logger';

export interface SettlementGenerationResult {
  success: boolean;
  totalCompanies: number;
  totalDrivers: number;
  settlementsGenerated: number;
  errors: Array<{ companyId: string; driverId?: string; error: string }>;
  startTime: Date;
  endTime: Date;
  duration: number;
}

/** Calculate default period (previous week: Monday-Sunday). */
function getDefaultPeriod(): { periodStart: Date; periodEnd: Date } {
  const periodEnd = new Date();
  periodEnd.setHours(0, 0, 0, 0);
  periodEnd.setDate(periodEnd.getDate() - periodEnd.getDay()); // Last Sunday

  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - 6); // Previous Monday

  return { periodStart, periodEnd };
}

/**
 * Core settlement generation logic for a list of companies.
 */
async function generateSettlementsForCompanies(
  companyIds: string[],
  periodStart: Date,
  periodEnd: Date
): Promise<SettlementGenerationResult> {
  const startTime = new Date();
  const errors: SettlementGenerationResult['errors'] = [];
  let settlementsGenerated = 0;
  let totalDrivers = 0;

  for (const companyId of companyIds) {
    try {
      // Load company accounting settings
      const settings = await prisma.accountingSettings.findUnique({
        where: { companyId },
      });
      const isStrict = settings?.settlementValidationMode === 'STRICT';
      const requireReady = isStrict || settings?.requireReadyForSettlementFlag;
      const forceIncludeNotReady = !requireReady;

      // Get active drivers
      const drivers = await prisma.driver.findMany({
        where: { companyId, status: 'AVAILABLE', deletedAt: null },
        select: {
          id: true,
          driverNumber: true,
          user: { select: { firstName: true, lastName: true } },
        },
      });

      totalDrivers += drivers.length;
      const settlementManager = new SettlementManager();

      for (const driver of drivers) {
        try {
          // Check for delivered loads in period
          const loadsInPeriod = await prisma.load.count({
            where: {
              driverId: driver.id,
              status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
              deliveredAt: { gte: periodStart, lte: periodEnd },
              deletedAt: null,
            },
          });

          if (loadsInPeriod === 0) continue;

          // Skip if settlement already exists for this period
          const existing = await prisma.settlement.findFirst({
            where: { driverId: driver.id, periodStart, periodEnd },
            select: { id: true },
          });
          if (existing) continue;

          // Generate settlement
          const settlement = await settlementManager.generateSettlement({
            driverId: driver.id,
            periodStart,
            periodEnd,
            forceIncludeNotReady,
          });

          settlementsGenerated++;
          logger.info(`Settlement ${settlement.settlementNumber} generated for driver ${driver.driverNumber}`);

          // Send notifications (non-blocking)
          await sendDriverNotification(driver.id, settlement.id);
          await sendAccountingNotification(companyId, settlement.id);
        } catch (error: any) {
          errors.push({
            companyId,
            driverId: driver.id,
            error: error.message || 'Unknown error',
          });
          logger.error(`Settlement generation failed for driver ${driver.driverNumber}`, { error: error.message });
        }
      }
    } catch (error: any) {
      errors.push({ companyId, error: error.message || 'Unknown error' });
      logger.error(`Settlement generation failed for company ${companyId}`, { error: error.message });
    }
  }

  const endTime = new Date();
  return {
    success: errors.length === 0,
    totalCompanies: companyIds.length,
    totalDrivers,
    settlementsGenerated,
    errors,
    startTime,
    endTime,
    duration: endTime.getTime() - startTime.getTime(),
  };
}

/**
 * Weekly cron: generate settlements for ALL active companies using default period.
 */
export async function runWeeklySettlementGeneration(): Promise<SettlementGenerationResult> {
  logger.info('Starting weekly settlement generation');
  const { periodStart, periodEnd } = getDefaultPeriod();

  const companies = await prisma.company.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const result = await generateSettlementsForCompanies(
    companies.map((c) => c.id),
    periodStart,
    periodEnd
  );

  await logCronExecution(result);
  logger.info(`Weekly settlement generation complete: ${result.settlementsGenerated} settlements, ${result.errors.length} errors`);
  return result;
}

/**
 * Manual trigger: generate settlements for a specific company or all companies
 * with optional custom date range.
 */
export async function triggerManualSettlementGeneration(
  companyId?: string,
  periodStart?: Date,
  periodEnd?: Date
): Promise<SettlementGenerationResult> {
  const period = periodStart && periodEnd
    ? { periodStart, periodEnd }
    : getDefaultPeriod();

  const companyIds = companyId
    ? [companyId]
    : (await prisma.company.findMany({ where: { isActive: true }, select: { id: true } })).map((c) => c.id);

  return generateSettlementsForCompanies(companyIds, period.periodStart, period.periodEnd);
}
