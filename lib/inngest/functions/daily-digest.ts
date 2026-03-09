/**
 * Daily Digest Notification
 *
 * Inngest cron function that runs every morning at 7:00 AM UTC.
 * Summarizes what matters most for each active company and posts
 * to Mattermost + creates in-app notifications for admins.
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications/helpers';
import { getMattermostNotificationService } from '@/lib/services/MattermostNotificationService';

export const dailyDigest = inngest.createFunction(
  {
    id: 'daily-digest',
    name: 'Daily Notification Digest',
    concurrency: { limit: 1 },
  },
  { cron: '0 7 * * *' }, // 7:00 AM UTC daily
  async ({ logger }) => {
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    let totalDigests = 0;

    for (const company of companies) {
      try {
        const [
          pendingLoads,
          inTransitLoads,
          dueToday,
          overdueInvoices,
          overdueInvoiceTotal,
          expiringDocs,
          idleDrivers,
          oosTrucks,
        ] = await Promise.all([
          prisma.load.count({
            where: { companyId: company.id, status: 'PENDING', deletedAt: null },
          }),
          prisma.load.count({
            where: {
              companyId: company.id,
              status: { in: ['EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'] },
              deletedAt: null,
            },
          }),
          prisma.load.count({
            where: {
              companyId: company.id,
              status: { in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'] },
              deliveryDate: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lte: new Date(new Date().setHours(23, 59, 59, 999)),
              },
              deletedAt: null,
            },
          }),
          prisma.invoice.count({
            where: {
              companyId: company.id,
              status: { in: ['SENT', 'OVERDUE'] },
              dueDate: { lt: new Date() },
            },
          }),
          prisma.invoice.aggregate({
            where: {
              companyId: company.id,
              status: { in: ['SENT', 'OVERDUE'] },
              dueDate: { lt: new Date() },
            },
            _sum: { balance: true },
          }),
          prisma.document.count({
            where: {
              company: { id: company.id },
              driverId: { not: null },
              expiryDate: {
                gte: new Date(),
                lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              },
            },
          }),
          prisma.driver.count({
            where: {
              companyId: company.id,
              status: 'AVAILABLE',
              deletedAt: null,
              loads: { none: { status: { in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'] } } },
            },
          }),
          prisma.truck.count({
            where: { companyId: company.id, status: 'OUT_OF_SERVICE', deletedAt: null },
          }),
        ]);

        // Skip if nothing to report
        if (!pendingLoads && !inTransitLoads && !dueToday && !overdueInvoices && !expiringDocs && !oosTrucks) {
          continue;
        }

        const outstandingBalance = Number(overdueInvoiceTotal._sum?.balance || 0);

        // Build digest message
        const lines: string[] = [
          `### :sunrise: Daily Digest — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
          '',
        ];

        if (pendingLoads > 0) lines.push(`- **${pendingLoads}** pending loads awaiting dispatch`);
        if (inTransitLoads > 0) lines.push(`- **${inTransitLoads}** loads in transit`);
        if (dueToday > 0) lines.push(`- **${dueToday}** deliveries due today`);
        if (overdueInvoices > 0) lines.push(`- **${overdueInvoices}** overdue invoices ($${outstandingBalance.toFixed(2)} outstanding)`);
        if (expiringDocs > 0) lines.push(`- **${expiringDocs}** documents expiring within 7 days`);
        if (idleDrivers > 0) lines.push(`- **${idleDrivers}** available drivers`);
        if (oosTrucks > 0) lines.push(`- **${oosTrucks}** trucks out of service`);

        const digestMessage = lines.join('\n');

        // Post to Mattermost
        const mm = getMattermostNotificationService();
        await mm.postDigest('dispatch', digestMessage).catch(() => {});

        // Create in-app notification for admins
        const admins = await prisma.user.findMany({
          where: {
            companyId: company.id,
            role: { in: ['ADMIN', 'SUPER_ADMIN'] },
            deletedAt: null,
          },
          select: { id: true },
        });

        const summaryText = [
          pendingLoads > 0 ? `${pendingLoads} pending loads` : null,
          dueToday > 0 ? `${dueToday} due today` : null,
          overdueInvoices > 0 ? `${overdueInvoices} overdue invoices` : null,
          expiringDocs > 0 ? `${expiringDocs} expiring docs` : null,
        ].filter(Boolean).join(', ');

        for (const admin of admins) {
          await createNotification({
            userId: admin.id,
            type: 'SYSTEM_ALERT',
            title: 'Daily Digest',
            message: summaryText || 'All systems operational',
            link: '/dashboard',
          });
        }

        totalDigests++;
      } catch (error) {
        logger.error(`Daily digest failed for company ${company.id}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { digestsSent: totalDigests, companiesProcessed: companies.length };
  }
);
