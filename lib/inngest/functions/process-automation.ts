/**
 * Process Automation Rule — Inngest Function
 *
 * Triggered by 'automation/lead-event' when a lead event occurs
 * (status change, new lead, etc.). Evaluates matching automation rules.
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { AutomationManager } from '@/lib/managers/AutomationManager';
import { WorkflowExecutionManager } from '@/lib/managers/WorkflowExecutionManager';

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

        // Check recruiting workflows
        await step.run('check-workflows', async () => {
            const workflows = await prisma.recruitingWorkflow.findMany({
                where: { companyId, isActive: true, mode: 'LIVE' },
            });

            let triggered = 0;
            for (const wf of workflows) {
                const triggerValue = wf.triggerValue as Record<string, any>;
                if (WorkflowExecutionManager.matchesTrigger(wf.triggerType, triggerValue, eventType, metadata as Record<string, unknown> | undefined)) {
                    await inngest.send({
                        name: 'workflow/start',
                        data: { workflowId: wf.id, leadId, companyId },
                    });
                    triggered++;
                }
            }
            return { triggered };
        });

        return { leadId, eventType, ...result };
    }
);
