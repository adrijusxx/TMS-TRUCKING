/**
 * CRM Notification Triggers
 *
 * Handles all recruiting/CRM-specific notifications:
 * follow-up reminders, SLA alerts, and new application alerts.
 */

import { prisma } from '../prisma';

/**
 * Get CRM notification preferences for a company.
 * Returns defaults if not configured.
 */
async function getCrmNotificationPrefs(companyId: string) {
    const settings = await prisma.companySettings.findUnique({
        where: { companyId },
        select: { notificationSettings: true },
    });
    const notifSettings = (settings?.notificationSettings as any) || {};
    return {
        notifyOnAssignment: true,
        notifyOnFollowUpOverdue: true,
        notifyOnSLABreach: true,
        notifyOnNewApplication: true,
        ...(notifSettings.crm || {}),
    };
}

/**
 * Notify a recruiter that a lead follow-up is due/overdue
 */
export async function notifyFollowUpDue(
    leadId: string,
    assignedUserId: string,
    leadName: string,
    leadNumber: string,
    followUpNote?: string | null,
    companyId?: string
) {
    try {
        if (companyId) {
            const prefs = await getCrmNotificationPrefs(companyId);
            if (!prefs.notifyOnFollowUpOverdue) return;
        }

        const message = followUpNote
            ? `Follow-up due for ${leadName} (${leadNumber}): ${followUpNote}`
            : `Follow-up due for ${leadName} (${leadNumber})`;

        await prisma.notification.create({
            data: {
                userId: assignedUserId,
                type: 'LEAD_FOLLOW_UP_DUE',
                title: `Follow-Up Due: ${leadName}`,
                message,
                link: `/dashboard/crm/leads?search=${leadNumber}`,
            },
        });
    } catch (error) {
        console.error('[CRM Notification] Follow-up due error:', error);
    }
}

/**
 * Notify recruiters when a lead has exceeded the SLA threshold for its current stage
 */
export async function notifyLeadSLABreach(
    leadId: string,
    assignedUserId: string | null,
    leadName: string,
    leadNumber: string,
    status: string,
    daysSinceEntry: number,
    threshold: number,
    companyId?: string
) {
    try {
        if (companyId) {
            const prefs = await getCrmNotificationPrefs(companyId);
            if (!prefs.notifyOnSLABreach) return;
        }

        const message = `${leadName} (${leadNumber}) has been in "${status.replace(/_/g, ' ')}" for ${daysSinceEntry} days (SLA: ${threshold} days)`;

        // Notify assigned recruiter if there is one
        if (assignedUserId) {
            await prisma.notification.create({
                data: {
                    userId: assignedUserId,
                    type: 'LEAD_SLA_ALERT',
                    title: `SLA Alert: ${leadName}`,
                    message,
                    link: `/dashboard/crm/leads?search=${leadNumber}`,
                },
            });
        }
    } catch (error) {
        console.error('[CRM Notification] SLA breach error:', error);
    }
}

/**
 * Notify all recruiters in a company about a new driver application
 */
export async function notifyNewApplication(
    leadId: string,
    companyId: string,
    leadName: string,
    leadNumber: string
) {
    try {
        const prefs = await getCrmNotificationPrefs(companyId);
        if (!prefs.notifyOnNewApplication) return;

        // Find all users who might handle recruiting (admins and HR)
        const recruiters = await prisma.user.findMany({
            where: {
                companyId,
                role: { in: ['SUPER_ADMIN', 'ADMIN', 'HR', 'DISPATCHER'] },
                deletedAt: null,
            },
            select: { id: true },
        });

        const notifications = recruiters.map((r) => ({
            userId: r.id,
            type: 'LEAD_NEW_APPLICATION' as const,
            title: `New Application: ${leadName}`,
            message: `${leadName} submitted a driver application (${leadNumber})`,
            link: `/dashboard/crm/leads?search=${leadNumber}`,
        }));

        if (notifications.length > 0) {
            await prisma.notification.createMany({ data: notifications });
        }
    } catch (error) {
        console.error('[CRM Notification] New application error:', error);
    }
}
