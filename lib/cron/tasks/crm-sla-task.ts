/**
 * CRM Lead SLA Check Task
 *
 * Standalone version of the Inngest check-lead-sla function.
 * Finds leads exceeding SLA thresholds and sends alert notifications.
 */

import { prisma } from '@/lib/prisma';
import { notifyLeadSLABreach } from '@/lib/notifications/crm-triggers';

interface SLAResult {
  alerts: number;
  companies: number;
}

export async function runSLACheckTask(): Promise<SLAResult> {
  const slaConfigs = await prisma.recruitingSLAConfig.findMany({
    where: { enabled: true },
    select: { companyId: true, status: true, maxDays: true },
  });

  if (slaConfigs.length === 0) {
    return { alerts: 0, companies: 0 };
  }

  const byCompany = new Map<string, { status: string; maxDays: number }[]>();
  for (const config of slaConfigs) {
    const list = byCompany.get(config.companyId) || [];
    list.push({ status: config.status, maxDays: config.maxDays });
    byCompany.set(config.companyId, list);
  }

  let totalAlerts = 0;

  for (const [companyId, configs] of Array.from(byCompany.entries())) {
    const now = new Date();

    for (const config of configs) {
      try {
        const cutoff = new Date(now.getTime() - config.maxDays * 24 * 60 * 60 * 1000);

        const staleLeads = await prisma.lead.findMany({
          where: {
            companyId,
            status: config.status as never,
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
          take: 50,
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
          totalAlerts++;
        }
      } catch (error) {
        console.error(`[Cron:SLA] Error for company ${companyId}, status ${config.status}:`, error);
      }
    }
  }

  return { alerts: totalAlerts, companies: byCompany.size };
}
