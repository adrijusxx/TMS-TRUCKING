/**
 * Daily Automation — Inngest Cron Function
 *
 * Runs at 3 AM daily. Performs load status updates, document expiry checks,
 * safety expiration checks, and HOS violation checks for all companies.
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { autoUpdateLoadStatuses } from '@/lib/automation/load-status';
import { checkAllDocumentExpiries } from '@/lib/automation/document-expiry';
import { dailyExpirationCheck } from '@/scripts/cron/jobs/daily-expiration-check';
import { dailyHOSViolationCheck } from '@/scripts/cron/jobs/daily-hos-violation-check';

export const dailyAutomation = inngest.createFunction(
  {
    id: 'daily-automation',
    name: 'Daily Automation Tasks',
    concurrency: { limit: 1 },
    retries: 2,
  },
  { cron: '0 3 * * *' },
  async ({ step, logger }) => {
    const companies = await step.run('get-companies', async () => {
      return prisma.company.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });
    });

    let totalLoadUpdates = 0;
    let totalDocChecked = 0;
    let totalDocExpiring = 0;
    const errors: string[] = [];

    // Per-company tasks: load statuses + document expiry
    for (const company of companies) {
      const result = await step.run(`company-tasks-${company.id}`, async () => {
        let updated = 0;
        let checked = 0;
        let expiring = 0;

        try {
          const loadResult = await autoUpdateLoadStatuses(company.id);
          updated = loadResult.updated;
        } catch (error) {
          return { updated: 0, checked: 0, expiring: 0, error: `${company.name} loads: ${(error as Error).message}` };
        }

        try {
          const docResult = await checkAllDocumentExpiries(company.id, 30);
          checked = docResult.totalChecked;
          expiring = docResult.totalExpiring;
        } catch (error) {
          return { updated, checked: 0, expiring: 0, error: `${company.name} docs: ${(error as Error).message}` };
        }

        return { updated, checked, expiring, error: null };
      });

      totalLoadUpdates += result.updated;
      totalDocChecked += result.checked;
      totalDocExpiring += result.expiring;
      if (result.error) errors.push(result.error);
    }

    // Global safety expiration checks
    await step.run('safety-expiration-check', async () => {
      try {
        await dailyExpirationCheck();
      } catch (error) {
        errors.push(`Safety expiration: ${(error as Error).message}`);
      }
    });

    // Global HOS violation checks
    await step.run('hos-violation-check', async () => {
      try {
        await dailyHOSViolationCheck();
      } catch (error) {
        errors.push(`HOS violations: ${(error as Error).message}`);
      }
    });

    logger.info(`Daily automation: ${companies.length} companies, ${totalLoadUpdates} loads, ${totalDocExpiring} expiring docs`);
    return {
      companies: companies.length,
      loadUpdates: totalLoadUpdates,
      docsChecked: totalDocChecked,
      docsExpiring: totalDocExpiring,
      errors,
    };
  }
);
