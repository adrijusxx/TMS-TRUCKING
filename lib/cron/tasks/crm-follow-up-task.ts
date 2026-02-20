/**
 * CRM Follow-Up Reminder Task
 *
 * Standalone version of the Inngest check-lead-follow-ups function.
 * Finds leads with overdue follow-ups and sends notifications.
 */

import { prisma } from '@/lib/prisma';
import { notifyFollowUpDue } from '@/lib/notifications/crm-triggers';

interface FollowUpResult {
  notified: number;
  totalOverdue: number;
}

export async function runFollowUpCheckTask(): Promise<FollowUpResult> {
  const overdueLeads = await prisma.lead.findMany({
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

  if (overdueLeads.length === 0) {
    return { notified: 0, totalOverdue: 0 };
  }

  const recentCutoff = new Date(Date.now() - 4 * 60 * 60 * 1000);
  let notified = 0;

  for (const lead of overdueLeads) {
    try {
      const recentNotification = await prisma.notification.findFirst({
        where: {
          userId: lead.assignedToId!,
          type: 'LEAD_FOLLOW_UP_DUE',
          link: { contains: lead.leadNumber },
          createdAt: { gte: recentCutoff },
        },
      });

      if (recentNotification) continue;

      await notifyFollowUpDue(
        lead.id,
        lead.assignedToId!,
        `${lead.firstName} ${lead.lastName}`,
        lead.leadNumber,
        lead.nextFollowUpNote
      );
      notified++;
    } catch (error) {
      console.error(`[Cron:FollowUp] Error for lead ${lead.leadNumber}:`, error);
    }
  }

  return { notified, totalOverdue: overdueLeads.length };
}
