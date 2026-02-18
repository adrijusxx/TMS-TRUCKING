/**
 * CRM Lead SLA Check
 *
 * Runs daily at 6 AM. For each company with SLA configs, finds leads
 * that have exceeded the time threshold in their current status and
 * sends alert notifications to assigned recruiters.
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { notifyLeadSLABreach } from '@/lib/notifications/crm-triggers';

export const checkLeadSLA = inngest.createFunction(
    { id: 'check-lead-sla', name: 'CRM Pipeline SLA Check' },
    { cron: '0 6 * * *' }, // Daily at 6 AM
    async ({ step }) => {
        // Get all companies with SLA configs
        const slaConfigs = await step.run('load-sla-configs', async () => {
            return prisma.recruitingSLAConfig.findMany({
                where: { enabled: true },
                select: { companyId: true, status: true, maxDays: true },
            });
        });

        if (slaConfigs.length === 0) {
            return { checked: true, alerts: 0 };
        }

        // Group configs by company
        const byCompany = new Map<string, { status: string; maxDays: number }[]>();
        for (const config of slaConfigs) {
            const list = byCompany.get(config.companyId) || [];
            list.push({ status: config.status, maxDays: config.maxDays });
            byCompany.set(config.companyId, list);
        }

        let totalAlerts = 0;

        for (const [companyId, configs] of byCompany) {
            const alerts = await step.run(`check-company-${companyId}`, async () => {
                let alertCount = 0;
                const now = new Date();

                for (const config of configs) {
                    const cutoff = new Date(now.getTime() - config.maxDays * 24 * 60 * 60 * 1000);

                    const staleLeads = await prisma.lead.findMany({
                        where: {
                            companyId,
                            status: config.status as any,
                            updatedAt: { lt: cutoff },
                            deletedAt: null,
                        },
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            leadNumber: true,
                            assignedToId: true,
                            updatedAt: true,
                        },
                        take: 50, // Cap to prevent notification floods
                    });

                    for (const lead of staleLeads) {
                        const daysSince = Math.floor(
                            (now.getTime() - lead.updatedAt.getTime()) / (24 * 60 * 60 * 1000)
                        );

                        await notifyLeadSLABreach(
                            lead.id,
                            lead.assignedToId,
                            `${lead.firstName} ${lead.lastName}`,
                            lead.leadNumber,
                            config.status,
                            daysSince,
                            config.maxDays
                        );
                        alertCount++;
                    }
                }

                return alertCount;
            });
            totalAlerts += alerts;
        }

        return { checked: true, alerts: totalAlerts, companies: byCompany.size };
    }
);
