/**
 * Process Workflow Step — Inngest Functions
 *
 * Handles workflow/start and workflow/resume events.
 * Delegates execution to WorkflowExecutionManager.
 */

import { inngest } from '../client';
import { WorkflowExecutionManager } from '@/lib/managers/WorkflowExecutionManager';

export const startWorkflow = inngest.createFunction(
    { id: 'start-workflow', name: 'Start Recruiting Workflow', retries: 2 },
    { event: 'workflow/start' },
    async ({ event, step }) => {
        const { workflowId, leadId, companyId } = event.data;

        await step.run('execute-workflow', async () => {
            await WorkflowExecutionManager.startWorkflow(workflowId, leadId, companyId);
        });

        return { workflowId, leadId, status: 'started' };
    }
);

export const resumeWorkflow = inngest.createFunction(
    { id: 'resume-workflow', name: 'Resume Recruiting Workflow', retries: 2 },
    { event: 'workflow/resume' },
    async ({ event, step }) => {
        const { executionId, nodeId } = event.data;

        await step.run('resume-execution', async () => {
            await WorkflowExecutionManager.resumeFromNode(executionId, nodeId);
        });

        return { executionId, nodeId, status: 'resumed' };
    }
);
