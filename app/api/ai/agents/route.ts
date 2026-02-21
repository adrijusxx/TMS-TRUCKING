import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { AIAgentService } from '@/lib/services/AIAgentService';
import { z } from 'zod';

const agentCreateSchema = z.object({
    slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    systemPrompt: z.string().min(10).max(10000),
    model: z.string().default('gpt-4o-mini'),
    temperature: z.number().min(0).max(1).default(0.3),
    maxTokens: z.number().min(100).max(4000).default(500),
    isActive: z.boolean().default(true),
});

/**
 * GET /api/ai/agents — List all agents for the company
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const agentService = new AIAgentService();
        const agents = await agentService.listAgents(session.user.companyId);

        return NextResponse.json({ success: true, data: agents });
    } catch (error: any) {
        console.error('[API] Error listing agents:', error);
        return NextResponse.json({ error: error.message || 'Failed to list agents' }, { status: 500 });
    }
}

/**
 * POST /api/ai/agents — Create a new agent
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validated = agentCreateSchema.parse(body);

        // Check slug uniqueness
        const existing = await prisma.aIAgent.findUnique({
            where: { companyId_slug: { companyId: session.user.companyId, slug: validated.slug } },
        });
        if (existing) {
            return NextResponse.json({ error: `Agent with slug "${validated.slug}" already exists` }, { status: 409 });
        }

        const agentService = new AIAgentService();
        const agent = await agentService.createAgent(session.user.companyId, validated);

        return NextResponse.json({ success: true, data: agent }, { status: 201 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
        }
        console.error('[API] Error creating agent:', error);
        return NextResponse.json({ error: error.message || 'Failed to create agent' }, { status: 500 });
    }
}
