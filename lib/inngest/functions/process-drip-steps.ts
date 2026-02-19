/**
 * Process Drip Steps — Inngest Cron Function
 *
 * Runs every 15 minutes. Finds campaign recipients with a scheduled
 * drip step (nextSendAt <= now) and sends the next message.
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { CampaignManager } from '@/lib/managers/CampaignManager';

export const processDripSteps = inngest.createFunction(
    { id: 'process-drip-steps', name: 'Process Campaign Drip Steps' },
    { cron: '*/15 * * * *' }, // Every 15 minutes
    async ({ step }) => {
        const dueRecipients = await step.run('find-due-recipients', async () => {
            return prisma.campaignRecipient.findMany({
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
        });

        if (dueRecipients.length === 0) {
            return { processed: 0 };
        }

        let sent = 0;
        let failed = 0;

        for (const recipient of dueRecipients) {
            await step.run(`drip-${recipient.id}`, async () => {
                // Verify campaign is still active
                const campaign = await prisma.campaign.findUnique({
                    where: { id: recipient.campaignId },
                    select: { status: true },
                });
                if (campaign?.status !== 'ACTIVE') return;

                const currentStep = recipient.campaign.steps[recipient.currentStepIndex];
                if (!currentStep) return;

                const result = await CampaignManager.executeSend(
                    recipient.id,
                    currentStep.id,
                    recipient.campaignId,
                    recipient.campaign.createdById
                );

                if (result.success) {
                    sent++;
                    // Schedule next step or mark complete
                    await CampaignManager.scheduleNextStep(recipient.id, recipient.campaignId);
                } else {
                    failed++;
                }
            });
        }

        // Check completion for all affected campaigns
        const campaignIds = [...new Set(dueRecipients.map((r) => r.campaignId))];
        for (const cid of campaignIds) {
            await step.run(`check-complete-${cid}`, async () => {
                await CampaignManager.checkCampaignCompletion(cid);
            });
        }

        return { processed: dueRecipients.length, sent, failed };
    }
);
