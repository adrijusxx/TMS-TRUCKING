/**
 * Hourly Automation — Inngest Cron Function
 *
 * Runs at :20 every hour. Updates load statuses based on pickup/delivery
 * dates for all active companies.
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { autoUpdateLoadStatuses } from '@/lib/automation/load-status';

export const hourlyAutomation = inngest.createFunction(
  {
    id: 'hourly-automation',
    name: 'Hourly Load Status Automation',
    concurrency: { limit: 1 },
    retries: 2,
  },
  { cron: '20 * * * *' },
  async ({ step, logger }) => {
    const companies = await step.run('get-companies', async () => {
      return prisma.company.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });
    });

    let totalUpdated = 0;
    const errors: string[] = [];

    for (const company of companies) {
      const result = await step.run(`update-loads-${company.id}`, async () => {
        try {
          const r = await autoUpdateLoadStatuses(company.id);
          return { updated: r.updated, error: null };
        } catch (error) {
          const msg = `${company.name}: ${error instanceof Error ? error.message : 'Unknown'}`;
          return { updated: 0, error: msg };
        }
      });

      totalUpdated += result.updated;
      if (result.error) errors.push(result.error);
    }

    logger.info(`Hourly automation: ${companies.length} companies, ${totalUpdated} loads updated`);
    return { companies: companies.length, updated: totalUpdated, errors };
  }
);
