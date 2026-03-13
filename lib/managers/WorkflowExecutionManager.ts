/**
 * Workflow Execution Manager
 *
 * Core engine for executing recruiting workflow graphs.
 * Traverses nodes, dispatches to handlers, manages execution state.
 */

import { prisma } from '@/lib/prisma';
import { WorkflowNode, WorkflowExecution, Lead } from '@prisma/client';
import { inngest } from '@/lib/inngest/client';
import {
    NodeResult,
    executeSendSms,
    executeSendEmail,
    executeAiWriteSms,
    executeAiWriteEmail,
    executeAiScore,
    executeAiBranch,
    executeDelay,
    executeUpdateStatus,
    executeAddTag,
    executeAssignLead,
} from './WorkflowNodeHandlers';

export class WorkflowExecutionManager {

    /**
     * Start a new workflow execution for a lead
     */
    static async startWorkflow(workflowId: string, leadId: string, companyId: string): Promise<void> {
        const workflow = await prisma.recruitingWorkflow.findUnique({
            where: { id: workflowId },
            include: { nodes: { orderBy: { sortOrder: 'asc' } } },
        });

        if (!workflow || !workflow.isActive) return;

        // Check if already running for this lead
        const existing = await prisma.workflowExecution.findUnique({
            where: { workflowId_leadId: { workflowId, leadId } },
        });
        if (existing && existing.status === 'RUNNING') return;

        // Find the first non-TRIGGER node
        const firstNode = workflow.nodes.find(n => n.nodeType !== 'TRIGGER');
        if (!firstNode) return;

        const execution = await prisma.workflowExecution.create({
            data: {
                workflowId,
                leadId,
                status: 'RUNNING',
                currentNodeId: firstNode.id,
            },
        });

        await prisma.recruitingWorkflow.update({
            where: { id: workflowId },
            data: { totalEnrolled: { increment: 1 } },
        });

        await this.executeFromNode(execution.id, firstNode.id, workflow.nodes, companyId);
    }

    /**
     * Resume execution from a specific node (after DELAY)
     */
    static async resumeFromNode(executionId: string, nodeId: string): Promise<void> {
        const execution = await prisma.workflowExecution.findUnique({
            where: { id: executionId },
            include: { workflow: { include: { nodes: { orderBy: { sortOrder: 'asc' } } } } },
        });

        if (!execution || execution.status !== 'WAITING') return;

        await prisma.workflowExecution.update({
            where: { id: executionId },
            data: { status: 'RUNNING', currentNodeId: nodeId },
        });

        await this.executeFromNode(
            executionId,
            nodeId,
            execution.workflow.nodes,
            execution.workflow.companyId
        );
    }

    /**
     * Execute nodes sequentially from a starting point
     */
    private static async executeFromNode(
        executionId: string,
        startNodeId: string,
        allNodes: WorkflowNode[],
        companyId: string
    ): Promise<void> {
        const nodeMap = new Map(allNodes.map(n => [n.id, n]));
        let currentNodeId: string | null | undefined = startNodeId;
        let iterationGuard = 0;
        const MAX_ITERATIONS = 50;

        while (currentNodeId && iterationGuard < MAX_ITERATIONS) {
            iterationGuard++;
            const node = nodeMap.get(currentNodeId);
            if (!node || node.nodeType === 'END') break;

            // Fetch fresh lead data each iteration (status/tags may have changed)
            const execution = await prisma.workflowExecution.findUnique({
                where: { id: executionId },
            });
            if (!execution) break;

            const lead = await prisma.lead.findUnique({ where: { id: execution.leadId } });
            if (!lead) break;

            try {
                const result = await this.dispatchNode(node, lead, companyId);

                // Log the execution step
                await prisma.workflowExecutionStep.create({
                    data: {
                        executionId,
                        nodeId: node.id,
                        nodeType: node.nodeType,
                        status: result.success ? 'success' : 'failed',
                        output: result.output as any,
                    },
                });

                // Handle DELAY — pause execution and schedule resume
                if (result.waitUntil) {
                    const nextId = result.nextNodeId;
                    await prisma.workflowExecution.update({
                        where: { id: executionId },
                        data: {
                            status: 'WAITING',
                            currentNodeId: nextId,
                            nextResumeAt: result.waitUntil,
                        },
                    });

                    if (nextId) {
                        await inngest.send({
                            name: 'workflow/resume',
                            data: { executionId, nodeId: nextId },
                            ts: result.waitUntil.getTime(),
                        });
                    }
                    return;
                }

                currentNodeId = result.nextNodeId;

                await prisma.workflowExecution.update({
                    where: { id: executionId },
                    data: { currentNodeId: currentNodeId || null },
                });

            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                await prisma.workflowExecutionStep.create({
                    data: {
                        executionId,
                        nodeId: node.id,
                        nodeType: node.nodeType,
                        status: 'failed',
                        output: { error: message },
                    },
                });

                await prisma.workflowExecution.update({
                    where: { id: executionId },
                    data: { status: 'FAILED', error: message },
                });
                return;
            }
        }

        // Workflow completed
        await prisma.workflowExecution.update({
            where: { id: executionId },
            data: { status: 'COMPLETED', completedAt: new Date() },
        });

        const execution = await prisma.workflowExecution.findUnique({ where: { id: executionId } });
        if (execution) {
            await prisma.recruitingWorkflow.update({
                where: { id: execution.workflowId },
                data: { totalCompleted: { increment: 1 } },
            });
        }
    }

    /**
     * Dispatch a node to its handler
     */
    private static async dispatchNode(
        node: WorkflowNode,
        lead: Lead,
        companyId: string
    ): Promise<NodeResult> {
        switch (node.nodeType) {
            case 'SEND_SMS':       return executeSendSms(node, lead, companyId);
            case 'SEND_EMAIL':     return executeSendEmail(node, lead, companyId);
            case 'AI_WRITE_SMS':   return executeAiWriteSms(node, lead);
            case 'AI_WRITE_EMAIL': return executeAiWriteEmail(node, lead);
            case 'AI_SCORE':       return executeAiScore(node, lead);
            case 'AI_BRANCH':      return executeAiBranch(node, lead);
            case 'DELAY':          return executeDelay(node);
            case 'UPDATE_STATUS':  return executeUpdateStatus(node, lead);
            case 'ADD_TAG':        return executeAddTag(node, lead);
            case 'ASSIGN_LEAD':    return executeAssignLead(node, lead, companyId);
            case 'TRIGGER':
            case 'END':
                return { success: true, nextNodeId: node.nextNodeId };
            default:
                return { success: false, output: { error: `Unknown node type: ${node.nodeType}` } };
        }
    }

    /**
     * Check if a workflow trigger matches a lead event
     */
    static matchesTrigger(
        triggerType: string,
        triggerValue: Record<string, any>,
        eventType: string,
        metadata?: Record<string, unknown>
    ): boolean {
        if (triggerType !== eventType) return false;
        if (!metadata) return true;

        if (triggerValue.toStatus && metadata.toStatus !== triggerValue.toStatus) return false;
        if (triggerValue.fromStatus && metadata.fromStatus !== triggerValue.fromStatus) return false;
        if (triggerValue.tag && metadata.tag !== triggerValue.tag) return false;
        if (triggerValue.source && metadata.source !== triggerValue.source) return false;

        return true;
    }
}
