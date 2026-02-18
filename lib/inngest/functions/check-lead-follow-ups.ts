/**
 * CRM Lead Follow-Up Reminder Check
 *
 * Runs every hour, finds leads with overdue follow-up dates,
 * and sends in-app notifications to assigned recruiters.
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { notifyFollowUpDue } from '@/lib/notifications/crm-triggers';

export const checkLeadFollowUps = inngest.createFunction(
    { id: 'check-lead-follow-ups', name: 'CRM Follow-Up Reminder Check' },
    { cron: '0 * * * *' }, // Every hour
    async ({ step }) => {
        const overdueLeads = await step.run('find-overdue-follow-ups', async () => {
            return prisma.lead.findMany({
                where: {
                    nextFollowUpDate: { lte: new Date() },
                    assignedToId: { not: null },
                    status: { notIn: ['HIRED', 'REJECTED'] },
                    deletedAt: null,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    leadNumber: true,
                    assignedToId: true,
                    nextFollowUpNote: true,
                },
            });
        });

        if (overdueLeads.length === 0) {
            return { checked: true, notified: 0 };
        }

        // Check which leads already have a recent follow-up notification (within last 4 hours)
        // to avoid spamming the same recruiter
        const recentCutoff = new Date(Date.now() - 4 * 60 * 60 * 1000);

        let notified = 0;
        for (const lead of overdueLeads) {
            await step.run(`notify-${lead.id}`, async () => {
                // Check for recent notification to avoid duplicates
                const recentNotification = await prisma.notification.findFirst({
                    where: {
                        userId: lead.assignedToId!,
                        type: 'LEAD_FOLLOW_UP_DUE',
                        link: { contains: lead.leadNumber },
                        createdAt: { gte: recentCutoff },
                    },
                });

                if (recentNotification) return;

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

        return { checked: true, notified, totalOverdue: overdueLeads.length };
    }
);
