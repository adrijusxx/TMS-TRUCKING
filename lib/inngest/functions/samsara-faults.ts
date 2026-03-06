/**
 * Samsara Fault Sync — Inngest Cron Function
 *
 * Runs at :40 every hour. Pulls fault codes from Samsara for all active
 * companies with linked trucks and syncs into TruckFaultHistory.
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { FleetMaintenanceService } from '@/lib/services/FleetMaintenanceService';
import { getMattermostNotificationService } from '@/lib/services/MattermostNotificationService';

export const samsaraFaultSync = inngest.createFunction(
  {
    id: 'samsara-fault-sync',
    name: 'Samsara Fault Code Sync',
    concurrency: { limit: 1 },
    retries: 2,
  },
  { cron: '40 * * * *' },
  async ({ step, logger }) => {
    const companies = await step.run('get-companies', async () => {
      return prisma.company.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });
    });

    let companiesProcessed = 0;
    let companiesSkipped = 0;
    const results: Array<{
      company: string;
      trucksProcessed: number;
      newFaults: number;
      resolvedFaults: number;
    }> = [];

    for (const company of companies) {
      const result = await step.run(`sync-${company.id}`, async () => {
        try {
          const service = new FleetMaintenanceService(company.id);
          const syncResult = await service.syncFaultCodes();

          if (syncResult.trucksProcessed > 0 || syncResult.trucksSkipped > 0) {
            return {
              processed: true,
              company: company.name,
              trucksProcessed: syncResult.trucksProcessed,
              newFaults: syncResult.newFaults,
              resolvedFaults: syncResult.resolvedFaults,
            };
          }
          return { processed: false, company: company.name, trucksProcessed: 0, newFaults: 0, resolvedFaults: 0 };
        } catch {
          return { processed: false, company: company.name, trucksProcessed: 0, newFaults: 0, resolvedFaults: 0 };
        }
      });

      if (result.processed) {
        companiesProcessed++;
        results.push({
          company: result.company,
          trucksProcessed: result.trucksProcessed,
          newFaults: result.newFaults,
          resolvedFaults: result.resolvedFaults,
        });

        // Post to Mattermost #maintenance for new faults
        if (result.newFaults > 0) {
          await step.run(`notify-faults-${company.id}`, async () => {
            await getMattermostNotificationService().notifyFaultCode({
              truckNumber: `${result.newFaults} truck(s)`,
              faultCode: `${result.newFaults} new`,
              description: `${result.newFaults} new fault code(s) detected across ${result.trucksProcessed} trucks for ${result.company}`,
              severity: result.newFaults >= 3 ? 'CRITICAL' : 'WARNING',
            });
          });
        }
      } else {
        companiesSkipped++;
      }
    }

    logger.info(`Samsara fault sync: ${companiesProcessed} processed, ${companiesSkipped} skipped`);
    return { companiesProcessed, companiesSkipped, results };
  }
);
