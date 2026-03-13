/**
 * Workflow Node Handlers
 *
 * Individual execution handlers for each workflow node type.
 * Called by WorkflowExecutionManager during graph traversal.
 */

import { prisma } from '@/lib/prisma';
import { WorkflowNode, Lead } from '@prisma/client';
import { AIRecruitingOutreachService } from '@/lib/services/crm/AIRecruitingOutreachService';
import { AIWorkflowDecisionService, BranchCondition } from '@/lib/services/crm/AIWorkflowDecisionService';
import { LeadScoringService } from '@/lib/services/crm/LeadScoringService';
import { AutomationManager } from './AutomationManager';

type LeadWithDetails = Lead;

export interface NodeResult {
    success: boolean;
    output?: Record<string, unknown>;
    nextNodeId?: string | null;
    waitUntil?: Date;
}

interface NodeConfig {
    // SEND_SMS / SEND_EMAIL
    templateId?: string;
    body?: string;
    subject?: string;
    // AI_WRITE_SMS / AI_WRITE_EMAIL
    tone?: 'professional' | 'casual' | 'urgent';
    goal?: string;
    maxChars?: number;
    // AI_SCORE
    forceRescore?: boolean;
    // AI_BRANCH
    condition?: string;
    value?: string | number;
    // DELAY
    days?: number;
    hours?: number;
    // UPDATE_STATUS
    status?: string;
    // ADD_TAG
    tag?: string;
    // ASSIGN_LEAD
    assignedToId?: string;
}

const outreachService = new AIRecruitingOutreachService();
const decisionService = new AIWorkflowDecisionService();
const scoringService = new LeadScoringService();

export async function executeSendSms(
    node: WorkflowNode,
    lead: LeadWithDetails,
    companyId: string
): Promise<NodeResult> {
    const config = node.config as unknown as NodeConfig;
    let body = config.body || '';

    if (config.templateId) {
        const template = await prisma.messageTemplate.findUnique({
            where: { id: config.templateId },
        });
        if (template) body = template.body;
    }

    // Render placeholders
    body = body
        .replace(/\{\{firstName\}\}/g, lead.firstName)
        .replace(/\{\{lastName\}\}/g, lead.lastName)
        .replace(/\{\{leadNumber\}\}/g, lead.leadNumber || '');

    return {
        success: true,
        output: { channel: 'SMS', body, leadPhone: lead.phone },
        nextNodeId: node.nextNodeId,
    };
}

export async function executeSendEmail(
    node: WorkflowNode,
    lead: LeadWithDetails,
    companyId: string
): Promise<NodeResult> {
    const config = node.config as unknown as NodeConfig;
    let body = config.body || '';
    let subject = config.subject || 'Message from our team';

    if (config.templateId) {
        const template = await prisma.messageTemplate.findUnique({
            where: { id: config.templateId },
        });
        if (template) {
            body = template.body;
            subject = template.subject || subject;
        }
    }

    body = body
        .replace(/\{\{firstName\}\}/g, lead.firstName)
        .replace(/\{\{lastName\}\}/g, lead.lastName)
        .replace(/\{\{leadNumber\}\}/g, lead.leadNumber || '');

    return {
        success: true,
        output: { channel: 'EMAIL', subject, body, leadEmail: lead.email },
        nextNodeId: node.nextNodeId,
    };
}

export async function executeAiWriteSms(
    node: WorkflowNode,
    lead: LeadWithDetails
): Promise<NodeResult> {
    const config = node.config as unknown as NodeConfig;
    const message = await outreachService.generateSMS(lead, {
        tone: config.tone || 'professional',
        goal: config.goal || 'Reach out to the candidate',
        maxChars: config.maxChars || 160,
    });

    return {
        success: true,
        output: { channel: 'SMS', body: message, aiGenerated: true },
        nextNodeId: node.nextNodeId,
    };
}

export async function executeAiWriteEmail(
    node: WorkflowNode,
    lead: LeadWithDetails
): Promise<NodeResult> {
    const config = node.config as unknown as NodeConfig;
    const email = await outreachService.generateEmail(lead, {
        tone: config.tone || 'professional',
        goal: config.goal || 'Reach out to the candidate',
    });

    return {
        success: true,
        output: { channel: 'EMAIL', ...email, aiGenerated: true },
        nextNodeId: node.nextNodeId,
    };
}

export async function executeAiScore(
    node: WorkflowNode,
    lead: LeadWithDetails
): Promise<NodeResult> {
    const config = node.config as unknown as NodeConfig;

    if (!config.forceRescore && lead.aiScore !== null) {
        return {
            success: true,
            output: { score: lead.aiScore, skipped: true },
            nextNodeId: node.nextNodeId,
        };
    }

    const result = await scoringService.scoreLead(lead.id);
    return {
        success: true,
        output: { score: result?.score, summary: result?.summary, recommendedAction: result?.recommendedAction },
        nextNodeId: node.nextNodeId,
    };
}

export async function executeAiBranch(
    node: WorkflowNode,
    lead: LeadWithDetails
): Promise<NodeResult> {
    const config = node.config as unknown as NodeConfig;
    const branchCondition: BranchCondition = {
        condition: (config.condition || 'ai_score_gte') as BranchCondition['condition'],
        value: config.value ?? 70,
    };

    const decision = await decisionService.evaluateBranch(lead, branchCondition);
    const nextNodeId = decision.branch === 'yes' ? node.yesNodeId : node.noNodeId;

    return {
        success: true,
        output: { branch: decision.branch, reason: decision.reason },
        nextNodeId,
    };
}

export async function executeDelay(node: WorkflowNode): Promise<NodeResult> {
    const config = node.config as unknown as NodeConfig;
    const delayMs = ((config.days || 0) * 86400 + (config.hours || 0) * 3600) * 1000;
    const waitUntil = new Date(Date.now() + delayMs);

    return {
        success: true,
        output: { delayDays: config.days, delayHours: config.hours, resumeAt: waitUntil.toISOString() },
        nextNodeId: node.nextNodeId,
        waitUntil,
    };
}

export async function executeUpdateStatus(
    node: WorkflowNode,
    lead: LeadWithDetails
): Promise<NodeResult> {
    const config = node.config as unknown as NodeConfig;
    if (!config.status) return { success: false, output: { error: 'No status configured' } };

    const previousStatus = lead.status;
    await prisma.lead.update({
        where: { id: lead.id },
        data: { status: config.status as any },
    });

    await prisma.leadActivity.create({
        data: {
            leadId: lead.id,
            type: 'STATUS_CHANGE',
            content: `Workflow auto-changed status: ${previousStatus} → ${config.status}`,
            userId: 'system',
            metadata: { automated: true, previousStatus, newStatus: config.status },
        },
    });

    return {
        success: true,
        output: { previousStatus, newStatus: config.status },
        nextNodeId: node.nextNodeId,
    };
}

export async function executeAddTag(
    node: WorkflowNode,
    lead: LeadWithDetails
): Promise<NodeResult> {
    const config = node.config as unknown as NodeConfig;
    if (!config.tag) return { success: false, output: { error: 'No tag configured' } };

    const currentTags = lead.tags || [];
    if (!currentTags.includes(config.tag)) {
        await prisma.lead.update({
            where: { id: lead.id },
            data: { tags: [...currentTags, config.tag] },
        });
    }

    return {
        success: true,
        output: { tag: config.tag, added: !currentTags.includes(config.tag) },
        nextNodeId: node.nextNodeId,
    };
}

export async function executeAssignLead(
    node: WorkflowNode,
    lead: LeadWithDetails,
    companyId: string
): Promise<NodeResult> {
    const config = node.config as unknown as NodeConfig;
    if (!config.assignedToId) return { success: false, output: { error: 'No assignee configured' } };

    let assigneeId = config.assignedToId;

    // Round-robin assignment
    if (assigneeId === 'round_robin') {
        const recruiters = await prisma.recruiterProfile.findMany({
            where: { companyId, isActive: true },
            select: { userId: true, currentActiveLeads: true, maxCapacity: true },
            orderBy: { currentActiveLeads: 'asc' },
        });

        const available = recruiters.find(r => r.currentActiveLeads < r.maxCapacity);
        if (!available) return { success: false, output: { error: 'No available recruiters' } };
        assigneeId = available.userId;
    }

    await prisma.lead.update({
        where: { id: lead.id },
        data: { assignedToId: assigneeId },
    });

    return {
        success: true,
        output: { assignedToId: assigneeId },
        nextNodeId: node.nextNodeId,
    };
}
