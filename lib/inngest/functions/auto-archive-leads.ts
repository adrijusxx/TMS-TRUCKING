/**
 * CRM Lead Auto-Archival
 *
 * Runs daily at 7 AM. For each company with auto-archival enabled,
 * soft-deletes leads in specified statuses that haven't been updated
 * within the configured threshold.
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';

export const autoArchiveLeads = inngest.createFunction(
    { id: 'auto-archive-leads', name: 'CRM Lead Auto-Archival' },
    { cron: '0 7 * * *' }, // Daily at 7 AM
    async ({ step }) => {
        const companies = await step.run('find-companies-with-archival', async () => {
            const settings = await prisma.companySettings.findMany({
                where: {
                    generalSettings: { not: undefined },
                },
                select: { companyId: true, generalSettings: true },
            });

            return settings.filter((s) => {
                const general = s.generalSettings as any;
                return general?.crm?.autoArchival?.enabled === true;
            });
        });

        let totalArchived = 0;

        for (const company of companies) {
            const archived = await step.run(`archive-${company.companyId}`, async () => {
                const general = company.generalSettings as any;
                const config = general.crm.autoArchival;
                const { archiveAfterDays, archiveStatuses } = config;

                if (!archiveStatuses?.length || !archiveAfterDays) return 0;

                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - archiveAfterDays);

                const result = await prisma.lead.updateMany({
                    where: {
                        companyId: company.companyId,
                        deletedAt: null,
                        status: { in: archiveStatuses },
                        updatedAt: { lte: cutoffDate },
                    },
                    data: { deletedAt: new Date() },
                });

                return result.count;
            });

            totalArchived += archived;
        }

        return { checked: companies.length, totalArchived };
    }
);
