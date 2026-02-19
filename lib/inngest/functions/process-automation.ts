/**
 * Process Automation Rule — Inngest Function
 *
 * Triggered by 'automation/lead-event' when a lead event occurs
 * (status change, new lead, etc.). Evaluates matching automation rules.
 */

import { inngest } from '../client';
import { AutomationManager } from '@/lib/managers/AutomationManager';

export const processAutomation = inngest.createFunction(
    { id: 'process-automation', name: 'Process Automation Rules' },
    { event: 'automation/lead-event' },
    async ({ event, step }) => {
        const { leadId, companyId, event: eventType, metadata } = event.data;

        const result = await step.run('evaluate-rules', async () => {
            return AutomationManager.evaluateLeadEvent(
                leadId,
                companyId,
                eventType,
                metadata as Record<string, unknown> | undefined
            );
        });

        return { leadId, eventType, ...result };
    }
);
