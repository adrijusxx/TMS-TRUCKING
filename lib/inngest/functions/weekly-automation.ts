/**
 * Weekly Automation — Inngest Cron Function
 *
 * Runs Sunday at 4 AM. Extended document expiry checks (60-day lookahead)
 * for all active companies.
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { checkAllDocumentExpiries } from '@/lib/automation/document-expiry';

export const weeklyAutomation = inngest.createFunction(
  {
    id: 'weekly-automation',
    name: 'Weekly Document Expiry Check',
    concurrency: { limit: 1 },
    retries: 2,
  },
  { cron: '0 4 * * 0' },
  async ({ step, logger }) => {
    const companies = await step.run('get-companies', async () => {
      return prisma.company.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });
    });

    let totalChecked = 0;
    let totalExpiring = 0;

    for (const company of companies) {
      const result = await step.run(`docs-${company.id}`, async () => {
        try {
          const r = await checkAllDocumentExpiries(company.id, 60);
          return { checked: r.totalChecked, expiring: r.totalExpiring };
        } catch {
          return { checked: 0, expiring: 0 };
        }
      });

      totalChecked += result.checked;
      totalExpiring += result.expiring;
    }

    logger.info(`Weekly automation: ${companies.length} companies, ${totalExpiring} expiring docs`);
    return { companies: companies.length, checked: totalChecked, expiring: totalExpiring };
  }
);
