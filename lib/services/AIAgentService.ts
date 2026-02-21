import { prisma } from '@/lib/prisma';

interface AgentCreateInput {
    slug: string;
    name: string;
    description?: string;
    systemPrompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    isActive?: boolean;
}

interface AgentUpdateInput {
    name?: string;
    description?: string | null;
    systemPrompt?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    isActive?: boolean;
}

const DEFAULT_AGENTS: AgentCreateInput[] = [
    {
        slug: 'telegram-driver',
        name: 'Telegram Driver Agent',
        description: 'Responds to driver messages via Telegram. Casual, concise dispatcher persona.',
        systemPrompt: `You are a TMS Dispatch AI acting as a friendly, human dispatcher.

PERSONA: Casual, confident, concise. Short texts (max 2 sentences, under 160 chars).
STYLE: Talk like a real dispatcher — no corporate speak, no "As an AI" disclaimers.

RULES:
1. If driver reports a breakdown: acknowledge it, ask what they need (tow, parts, ETA).
2. If driver asks a question: answer from Knowledge Base first, then trucking common sense.
3. If driver says "thanks" or "ok": just say "You're welcome, stay safe" or similar.
4. Ask for photos/video when troubleshooting mechanical issues.
5. Never give medical or legal advice — escalate to dispatch.

KNOWLEDGE BASE takes priority over general knowledge. Use specific company procedures when available.`,
        model: 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 500,
    },
    {
        slug: 'web-chatbot',
        name: 'Web Support Chatbot',
        description: 'Responds to user queries in the web dashboard. Professional, detailed TMS assistant.',
        systemPrompt: `You are an expert TMS AI Assistant for this company's Transportation Management System.

PERSONA: Professional, helpful, authoritative. Provide detailed answers.

RULES:
1. SEARCH FIRST: Prioritize "KNOWLEDGE BASE INFORMATION" over general knowledge.
2. PRECEDENCE: If you see a similar situation in KB logs, recommend the exact steps from that case.
3. SPECIFICITY: Use specific company terminology found in the context.
4. HONESTY: If the answer is not in the context, say "I don't have a specific policy for this in my Knowledge Base, but generally..."
5. For load/invoice queries, reference the specific data provided in context.

Return plain text response. Be concise and authoritative.`,
        model: 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 1000,
    },
];

/**
 * AI Agent Service
 * Manages AI agent configurations — system prompts, models, and KB scoping.
 * Auto-seeds default agents (Telegram Driver, Web Chatbot) on first access.
 */
export class AIAgentService {
    /**
     * Get agent by company + slug, auto-creating defaults if needed
     */
    async getAgent(companyId: string, slug: string) {
        let agent = await prisma.aIAgent.findUnique({
            where: { companyId_slug: { companyId, slug } },
        });

        if (!agent) {
            await this.getOrCreateDefaults(companyId);
            agent = await prisma.aIAgent.findUnique({
                where: { companyId_slug: { companyId, slug } },
            });
        }

        return agent;
    }

    /**
     * List all agents for a company (with document counts)
     */
    async listAgents(companyId: string) {
        await this.getOrCreateDefaults(companyId);

        return prisma.aIAgent.findMany({
            where: { companyId },
            include: {
                _count: { select: { documents: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    /**
     * Create a new custom agent
     */
    async createAgent(companyId: string, data: AgentCreateInput) {
        return prisma.aIAgent.create({
            data: { companyId, ...data },
        });
    }

    /**
     * Update an existing agent
     */
    async updateAgent(id: string, data: AgentUpdateInput) {
        return prisma.aIAgent.update({
            where: { id },
            data,
        });
    }

    /**
     * Delete an agent — orphaned docs become shared (agentId = null)
     */
    async deleteAgent(id: string) {
        await prisma.knowledgeBaseDocument.updateMany({
            where: { agentId: id },
            data: { agentId: null },
        });
        return prisma.aIAgent.delete({ where: { id } });
    }

    /**
     * Seed default agents if they don't exist yet
     */
    private async getOrCreateDefaults(companyId: string) {
        const existing = await prisma.aIAgent.count({ where: { companyId } });
        if (existing >= DEFAULT_AGENTS.length) return;

        for (const agent of DEFAULT_AGENTS) {
            await prisma.aIAgent.upsert({
                where: { companyId_slug: { companyId, slug: agent.slug } },
                create: { companyId, ...agent },
                update: {}, // Don't overwrite user customizations
            });
        }
    }
}
