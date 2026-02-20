/**
 * Fleet Dormancy & Driver Idle Check
 *
 * Runs every 4 hours. For each active company, detects dormant equipment
 * and idle drivers, then creates notifications for fleet/admin users.
 * Deduplicates: skips if the same alert was already sent within 24 hours.
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { FleetMonitoringManager } from '@/lib/managers/fleet-monitoring/FleetMonitoringManager';

export const checkFleetDormancy = inngest.createFunction(
  {
    id: 'check-fleet-dormancy',
    name: 'Fleet Dormancy & Driver Idle Check',
    retries: 2,
  },
  { cron: '0 */4 * * *' },
  async ({ step, logger }) => {
    const companies = await step.run('get-companies', async () => {
      return prisma.company.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });
    });

    let totalAlerts = 0;

    for (const company of companies) {
      const alerts = await step.run(`check-${company.id}`, async () => {
        const manager = new FleetMonitoringManager(company.id);
        const settings = await manager.getSettings();
        if (!settings.enableAlerts) return 0;

        const snapshot = await manager.getMonitoringSnapshot();
        let count = 0;

        // Get fleet/admin users to notify
        const users = await prisma.user.findMany({
          where: {
            companyId: company.id,
            role: { in: ['SUPER_ADMIN', 'ADMIN', 'FLEET'] },
            isActive: true,
          },
          select: { id: true },
        });

        if (users.length === 0) return 0;
        const userIds = users.map((u) => u.id);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Dormant equipment alerts
        const dormantItems = [...snapshot.dormantTrucks, ...snapshot.dormantTrailers];
        for (const eq of dormantItems) {
          if (eq.isLongTermOOS) continue;

          const linkPath = eq.type === 'TRUCK'
            ? `/dashboard/trucks/${eq.id}`
            : `/dashboard/trailers/${eq.id}`;

          const existing = await prisma.notification.findFirst({
            where: {
              type: 'DORMANT_EQUIPMENT',
              link: linkPath,
              createdAt: { gte: oneDayAgo },
            },
          });
          if (existing) continue;

          await prisma.notification.createMany({
            data: userIds.map((userId) => ({
              userId,
              type: 'DORMANT_EQUIPMENT' as const,
              title: `Dormant ${eq.type.toLowerCase()}: ${eq.number}`,
              message: `${eq.number} has been without a load for ${eq.daysSinceLastLoad} days.`,
              link: linkPath,
            })),
          });
          count++;
        }

        // Idle driver alerts
        for (const driver of snapshot.idleDrivers) {
          if (driver.idleHours < settings.driverIdleAlertHours) continue;

          const linkPath = `/dashboard/drivers/${driver.driverId}`;
          const existing = await prisma.notification.findFirst({
            where: {
              type: 'DRIVER_IDLE_ALERT',
              link: linkPath,
              createdAt: { gte: oneDayAgo },
            },
          });
          if (existing) continue;

          await prisma.notification.createMany({
            data: userIds.map((userId) => ({
              userId,
              type: 'DRIVER_IDLE_ALERT' as const,
              title: `Driver idle: ${driver.driverName}`,
              message: `${driver.driverName} (#${driver.driverNumber}) has been without a load for ${Math.round(driver.idleHours)}h.`,
              link: linkPath,
            })),
          });
          count++;
        }

        return count;
      });

      totalAlerts += alerts;
    }

    logger.info(`Fleet dormancy check: ${companies.length} companies, ${totalAlerts} alerts`);
    return { companiesChecked: companies.length, totalAlerts };
  }
);
