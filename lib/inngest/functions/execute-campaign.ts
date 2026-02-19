/**
 * Execute Campaign — Inngest Function
 *
 * Triggered when a campaign is activated. Sends the first step
 * to all PENDING recipients. For drip campaigns, schedules the next step.
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { CampaignManager } from '@/lib/managers/CampaignManager';

export const executeCampaign = inngest.createFunction(
    { id: 'campaign-execute', name: 'Execute Campaign' },
    { event: 'campaign/execute' },
    async ({ event, step }) => {
        const { campaignId, senderId } = event.data;

        const campaign = await step.run('load-campaign', async () => {
            return prisma.campaign.findUniqueOrThrow({
                where: { id: campaignId },
                include: {
                    steps: { orderBy: { sortOrder: 'asc' } },
                },
            });
        });

        if (campaign.status !== 'ACTIVE') {
            return { skipped: true, reason: `Campaign status is ${campaign.status}` };
        }

        if (campaign.steps.length === 0) {
            return { skipped: true, reason: 'No steps defined' };
        }

        const firstStep = campaign.steps[0];

        // Get all PENDING recipients
        const recipients = await step.run('load-recipients', async () => {
            return prisma.campaignRecipient.findMany({
                where: { campaignId, status: 'PENDING', currentStepIndex: 0 },
                select: { id: true },
            });
        });

        let sent = 0;
        let failed = 0;

        // Process recipients in batches via step.run for durability
        for (const recipient of recipients) {
            const result = await step.run(`send-${recipient.id}`, async () => {
                // Re-check campaign status before each send (supports pause)
                const current = await prisma.campaign.findUnique({
                    where: { id: campaignId },
                    select: { status: true },
                });
                if (current?.status !== 'ACTIVE') {
                    return { skipped: true };
                }

                const sendResult = await CampaignManager.executeSend(
                    recipient.id, firstStep.id, campaignId, senderId
                );

                // Schedule next drip step if applicable
                if (sendResult.success && campaign.isDrip && campaign.steps.length > 1) {
                    await CampaignManager.scheduleNextStep(recipient.id, campaignId);
                }

                return sendResult;
            });

            if ('skipped' in result) break; // Campaign was paused
            if (result.success) sent++;
            else failed++;
        }

        // Check if campaign is complete (non-drip)
        if (!campaign.isDrip) {
            await step.run('check-completion', async () => {
                await CampaignManager.checkCampaignCompletion(campaignId);
            });
        }

        return { campaignId, sent, failed, total: recipients.length };
    }
);
