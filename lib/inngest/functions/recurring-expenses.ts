/**
 * Recurring Expense Auto-Creation
 *
 * Runs daily at 8am. For each company, finds all recurring parent expenses
 * and creates the next occurrence if the due date has arrived.
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { companyExpenseManager } from '@/lib/managers/CompanyExpenseManager';

export const processRecurringExpenses = inngest.createFunction(
  {
    id: 'process-recurring-expenses',
    name: 'Recurring Expense Auto-Creation',
    retries: 2,
  },
  { cron: '0 8 * * *' },
  async ({ step, logger }) => {
    const companies = await step.run('get-companies', async () => {
      return prisma.company.findMany({
        where: { isActive: true },
        select: { id: true },
      });
    });

    let totalChecked = 0;
    let totalCreated = 0;

    for (const company of companies) {
      const result = await step.run(`process-company-${company.id}`, async () => {
        const parents = await companyExpenseManager.getRecurringParents(company.id);
        let created = 0;
        for (const parent of parents) {
          try {
            await companyExpenseManager.createRecurring(parent.id);
            created++;
          } catch {
            // Non-critical — skip this entry
          }
        }
        return { checked: parents.length, created };
      });

      totalChecked += result.checked;
      totalCreated += result.created;
    }

    logger.info(`Recurring expenses: ${totalChecked} checked, ${totalCreated} created`);
    return { companies: companies.length, checked: totalChecked, created: totalCreated };
  }
);
