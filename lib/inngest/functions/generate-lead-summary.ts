/**
 * Generate Lead AI Summary
 *
 * Triggered asynchronously when a lead is created or imported.
 * Generates a short card-friendly summary via LeadScoringService.
 */

import { inngest } from '../client';
import { LeadScoringService } from '@/lib/services/crm/LeadScoringService';

export const generateLeadSummary = inngest.createFunction(
    { id: 'generate-lead-summary', name: 'CRM Generate Lead Summary' },
    { event: 'crm/generate-lead-summary' },
    async ({ event, step }) => {
        const { leadId } = event.data;

        const summary = await step.run('generate-summary', async () => {
            const service = new LeadScoringService();
            return service.generateSummary(leadId);
        });

        return { leadId, summary };
    }
);
