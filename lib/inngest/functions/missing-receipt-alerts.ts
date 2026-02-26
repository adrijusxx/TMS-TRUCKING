/**
 * Missing Receipt Alert
 *
 * Runs daily at 9am. Finds all company expenses without a receipt that are
 * older than 48 hours and creates in-app notifications for the creator.
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { companyExpenseManager } from '@/lib/managers/CompanyExpenseManager';

export const sendMissingReceiptAlerts = inngest.createFunction(
  {
    id: 'send-missing-receipt-alerts',
    name: 'Missing Receipt Alert',
    retries: 2,
  },
  { cron: '0 9 * * *' },
  async ({ step, logger }) => {
    const companies = await step.run('get-companies', async () => {
      return prisma.company.findMany({
        where: { isActive: true },
        select: { id: true },
      });
    });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let totalAlerted = 0;

    for (const company of companies) {
      const alerted = await step.run(`alert-company-${company.id}`, async () => {
        const expenses = await companyExpenseManager.getExpensesMissingReceipts(company.id);
        let count = 0;

        for (const expense of expenses) {
          // Deduplicate: skip if already notified within 24h
          const existing = await prisma.notification.findFirst({
            where: {
              userId: expense.createdById,
              type: 'MISSING_RECEIPT' as any,
              link: `/dashboard/company-expenses`,
              createdAt: { gte: oneDayAgo },
              message: { contains: expense.expenseNumber },
            },
          });
          if (existing) continue;

          await prisma.notification.create({
            data: {
              userId: expense.createdById,
              type: 'MISSING_RECEIPT' as any,
              title: 'Missing receipt',
              message: `Expense ${expense.expenseNumber} (${expense.description}) is missing a receipt.`,
              link: `/dashboard/company-expenses`,
            },
          });
          count++;
        }
        return count;
      });

      totalAlerted += alerted;
    }

    logger.info(`Missing receipt alerts: ${totalAlerted} notifications sent`);
    return { companies: companies.length, alerted: totalAlerted };
  }
);
