/**
 * Campaign Drip Steps Task
 *
 * Standalone version of the Inngest process-drip-steps function.
 * Finds recipients with due drip steps and sends the next message.
 */

import { prisma } from '@/lib/prisma';
import { CampaignManager } from '@/lib/managers/CampaignManager';

interface DripResult {
  processed: number;
  sent: number;
  failed: number;
}

export async function runDripStepsTask(): Promise<DripResult> {
  const dueRecipients = await prisma.campaignRecipient.findMany({
    where: {
      status: 'PENDING',
      nextSendAt: { lte: new Date() },
      campaign: { status: 'ACTIVE', isDrip: true },
    },
    include: {
      campaign: {
        select: {
          id: true,
          createdById: true,
          steps: { orderBy: { sortOrder: 'asc' }, select: { id: true, sortOrder: true } },
        },
      },
    },
  });

  if (dueRecipients.length === 0) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const recipient of dueRecipients) {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: recipient.campaignId },
        select: { status: true },
      });
      if (campaign?.status !== 'ACTIVE') continue;

      const currentStep = recipient.campaign.steps[recipient.currentStepIndex];
      if (!currentStep) continue;

      const result = await CampaignManager.executeSend(
        recipient.id,
        currentStep.id,
        recipient.campaignId,
        recipient.campaign.createdById
      );

      if (result.success) {
        sent++;
        await CampaignManager.scheduleNextStep(recipient.id, recipient.campaignId);
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`[Cron:DripSteps] Error for recipient ${recipient.id}:`, error);
      failed++;
    }
  }

  const campaignIds = Array.from(new Set(dueRecipients.map((r) => r.campaignId)));
  for (const cid of campaignIds) {
    try {
      await CampaignManager.checkCampaignCompletion(cid);
    } catch (error) {
      console.error(`[Cron:DripSteps] Error checking completion for campaign ${cid}:`, error);
    }
  }

  return { processed: dueRecipients.length, sent, failed };
}
