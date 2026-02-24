import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import type { SettlementGenerationResult } from './settlement-generation';

/**
 * Log cron execution result to activity log.
 */
export async function logCronExecution(result: SettlementGenerationResult): Promise<void> {
  try {
    if (result.totalCompanies === 0) return;

    const firstCompany = await prisma.company.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    if (!firstCompany) {
      logger.warn('No active company found for settlement cron activity log');
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
    logger.error('Error logging settlement cron execution', { error });
  }
}
