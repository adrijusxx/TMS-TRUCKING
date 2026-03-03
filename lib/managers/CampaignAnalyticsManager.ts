/**
 * CampaignAnalyticsManager
 *
 * Calculates campaign performance metrics: send rates, response rates,
 * conversion rates, and cost per conversion. Supports single-campaign
 * detail and multi-campaign comparison views.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { NotFoundError } from '@/lib/errors';

export interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  channel: string;
  status: string;
  totalRecipients: number;
  totalSent: number;
  totalFailed: number;
  /** Recipients who had any activity after enrollment */
  totalResponded: number;
  /** Recipients whose leads ended up HIRED */
  totalConverted: number;
  sendRate: number;
  responseRate: number;
  conversionRate: number;
  /** Funnel data for visualization */
  funnel: FunnelStage[];
}

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface CampaignComparisonEntry {
  campaignId: string;
  campaignName: string;
  channel: string;
  totalRecipients: number;
  totalSent: number;
  responseRate: number;
  conversionRate: number;
}

export class CampaignAnalyticsManager {
  /**
   * Get detailed metrics for a single campaign
   */
  static async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        recipients: {
          include: {
            lead: {
              select: {
                id: true,
                status: true,
                lastContactedAt: true,
              },
            },
            executions: {
              select: { status: true, sentAt: true },
            },
          },
        },
      },
    });

    if (!campaign) throw new NotFoundError('Campaign', campaignId);

    const totalRecipients = campaign.recipients.length;

    // Count sent: recipients who have at least one SENT execution
    const totalSent = campaign.recipients.filter((r) =>
      r.executions.some((e) => e.status === 'SENT')
    ).length;

    const totalFailed = campaign.recipients.filter(
      (r) => r.status === 'FAILED'
    ).length;

    // Responded: leads that were contacted AFTER campaign enrollment
    const totalResponded = campaign.recipients.filter((r) => {
      const enrollDate = r.enrolledAt;
      return r.lead.lastContactedAt && r.lead.lastContactedAt > enrollDate;
    }).length;

    // Converted: leads that reached HIRED status
    const totalConverted = campaign.recipients.filter(
      (r) => r.lead.status === 'HIRED'
    ).length;

    const sendRate = totalRecipients > 0
      ? round((totalSent / totalRecipients) * 100)
      : 0;
    const responseRate = totalSent > 0
      ? round((totalResponded / totalSent) * 100)
      : 0;
    const conversionRate = totalSent > 0
      ? round((totalConverted / totalSent) * 100)
      : 0;

    // Build funnel
    const funnel = buildFunnel(totalRecipients, totalSent, totalResponded, totalConverted);

    logger.debug('Campaign metrics calculated', { campaignId, totalRecipients, totalSent });

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      channel: campaign.channel,
      status: campaign.status,
      totalRecipients,
      totalSent,
      totalFailed,
      totalResponded,
      totalConverted,
      sendRate,
      responseRate,
      conversionRate,
      funnel,
    };
  }

  /**
   * Compare multiple campaigns side by side
   */
  static async getCampaignComparison(
    companyId: string,
    campaignIds: string[]
  ): Promise<CampaignComparisonEntry[]> {
    if (campaignIds.length === 0) return [];

    const campaigns = await prisma.campaign.findMany({
      where: {
        id: { in: campaignIds },
        companyId,
      },
      include: {
        recipients: {
          include: {
            lead: {
              select: { status: true, lastContactedAt: true },
            },
            executions: {
              select: { status: true },
            },
          },
        },
      },
    });

    return campaigns.map((campaign) => {
      const totalRecipients = campaign.recipients.length;
      const totalSent = campaign.recipients.filter((r) =>
        r.executions.some((e) => e.status === 'SENT')
      ).length;

      const totalResponded = campaign.recipients.filter((r) => {
        return r.lead.lastContactedAt && r.lead.lastContactedAt > r.enrolledAt;
      }).length;

      const totalConverted = campaign.recipients.filter(
        (r) => r.lead.status === 'HIRED'
      ).length;

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        channel: campaign.channel,
        totalRecipients,
        totalSent,
        responseRate: totalSent > 0 ? round((totalResponded / totalSent) * 100) : 0,
        conversionRate: totalSent > 0 ? round((totalConverted / totalSent) * 100) : 0,
      };
    });
  }
}

// --------------- Helpers ---------------

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function buildFunnel(
  recipients: number,
  sent: number,
  responded: number,
  converted: number
): FunnelStage[] {
  const base = Math.max(recipients, 1);
  return [
    { stage: 'Recipients', count: recipients, percentage: 100 },
    { stage: 'Sent', count: sent, percentage: round((sent / base) * 100) },
    { stage: 'Responded', count: responded, percentage: round((responded / base) * 100) },
    { stage: 'Converted', count: converted, percentage: round((converted / base) * 100) },
  ];
}
