/**
 * CRM Lead Follow-Up Reminder Check
 *
 * Runs every hour. Uses per-company `reminderHoursBefore` setting to
 * notify recruiters ahead of (or when overdue) follow-up dates.
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { notifyFollowUpDue } from '@/lib/notifications/crm-triggers';

export const checkLeadFollowUps = inngest.createFunction(
    { id: 'check-lead-follow-ups', name: 'CRM Follow-Up Reminder Check' },
    { cron: '0 * * * *' }, // Every hour
    async ({ step }) => {
        // Load per-company reminder settings
        const companySettings = await step.run('load-reminder-settings', async () => {
            const all = await prisma.companySettings.findMany({
                select: { companyId: true, generalSettings: true },
            });
            const map: Record<string, number> = {};
            for (const s of all) {
                const general = (s.generalSettings as any) || {};
                const followUp = general?.crm?.followUpReminders;
                if (followUp?.enabled === false) continue;
                map[s.companyId] = followUp?.reminderHoursBefore ?? 0;
            }
            return map;
        });

        // Calculate broadest lookahead across all companies
        const maxHours = Math.max(0, ...Object.values(companySettings));
        const lookaheadDate = new Date(Date.now() + maxHours * 60 * 60 * 1000);

        const leads = await step.run('find-upcoming-follow-ups', async () => {
            return prisma.lead.findMany({
                where: {
                    nextFollowUpDate: { lte: lookaheadDate },
                    assignedToId: { not: null },
                    status: { notIn: ['HIRED', 'REJECTED'] },
                    deletedAt: null,
                },
                select: {
                    id: true,
                    companyId: true,
                    firstName: true,
                    lastName: true,
                    leadNumber: true,
                    assignedToId: true,
                    nextFollowUpDate: true,
                    nextFollowUpNote: true,
                },
            });
        });

        if (leads.length === 0) {
            return { checked: true, notified: 0 };
        }

        const recentCutoff = new Date(Date.now() - 4 * 60 * 60 * 1000);
        let notified = 0;

        for (const lead of leads) {
            await step.run(`notify-${lead.id}`, async () => {
                // Check if this lead's follow-up is within the company's reminder window
                const hours = companySettings[lead.companyId] ?? 0;
                const threshold = new Date(Date.now() + hours * 60 * 60 * 1000);
                if (lead.nextFollowUpDate && new Date(lead.nextFollowUpDate) > threshold) return;

                // Skip if recently notified
                const recent = await prisma.notification.findFirst({
                    where: {
                        userId: lead.assignedToId!,
                        type: 'LEAD_FOLLOW_UP_DUE',
                        link: { contains: lead.leadNumber },
                        createdAt: { gte: recentCutoff },
                    },
                });
                if (recent) return;

                await notifyFollowUpDue(
                    lead.id,
                    lead.assignedToId!,
                    `${lead.firstName} ${lead.lastName}`,
                    lead.leadNumber,
                    lead.nextFollowUpNote
                );
                notified++;
            });
        }

        return { checked: true, notified, totalLeads: leads.length };
    }
);
