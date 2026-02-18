/**
 * Auto-Score Lead via AI
 *
 * Triggered asynchronously when a lead meets auto-scoring criteria.
 * Calls the existing LeadScoringService and logs activity.
 */

import { inngest } from '../client';
import { LeadScoringService } from '@/lib/services/crm/LeadScoringService';
import { prisma } from '@/lib/prisma';

export const autoScoreLead = inngest.createFunction(
    { id: 'auto-score-lead', name: 'CRM Auto-Score Lead' },
    { event: 'crm/auto-score-lead' },
    async ({ event, step }) => {
        const { leadId } = event.data;

        const result = await step.run('score-lead', async () => {
            const scorer = new LeadScoringService();
            return scorer.scoreLead(leadId);
        });

        if (result) {
            await step.run('log-activity', async () => {
                await prisma.leadActivity.create({
                    data: {
                        leadId,
                        type: 'NOTE',
                        content: `AI auto-scored: ${result.score}/100 — ${result.recommendedAction}`,
                        userId: 'system',
                        metadata: {
                            autoScored: true,
                            score: result.score,
                            recommendation: result.recommendedAction,
                        },
                    },
                });
            });
        }

        return { scored: !!result, leadId, score: result?.score };
    }
);
