import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { AIAgentService } from '@/lib/services/AIAgentService';
import { z } from 'zod';

const agentUpdateSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    systemPrompt: z.string().min(10).max(10000).optional(),
    model: z.string().optional(),
    temperature: z.number().min(0).max(1).optional(),
    maxTokens: z.number().min(100).max(4000).optional(),
    isActive: z.boolean().optional(),
});

/**
 * GET /api/ai/agents/[id] — Get single agent with document count
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const agent = await prisma.aIAgent.findFirst({
            where: { id, companyId: session.user.companyId },
            include: { _count: { select: { documents: true } } },
        });

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: agent });
    } catch (error: any) {
        console.error('[API] Error fetching agent:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch agent' }, { status: 500 });
    }
}

/**
 * PUT /api/ai/agents/[id] — Update agent configuration
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify ownership
        const existing = await prisma.aIAgent.findFirst({
            where: { id, companyId: session.user.companyId },
        });
        if (!existing) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        const body = await request.json();
        const validated = agentUpdateSchema.parse(body);

        const agentService = new AIAgentService();
        const updated = await agentService.updateAgent(id, validated);

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
        }
        console.error('[API] Error updating agent:', error);
        return NextResponse.json({ error: error.message || 'Failed to update agent' }, { status: 500 });
    }
}

/**
 * DELETE /api/ai/agents/[id] — Delete agent (orphaned docs become shared)
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify ownership and prevent deleting default agents
        const existing = await prisma.aIAgent.findFirst({
            where: { id, companyId: session.user.companyId },
        });
        if (!existing) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        if (['telegram-driver', 'web-chatbot'].includes(existing.slug)) {
            return NextResponse.json({ error: 'Cannot delete default agents' }, { status: 400 });
        }

        const agentService = new AIAgentService();
        await agentService.deleteAgent(id);

        return NextResponse.json({ success: true, message: 'Agent deleted' });
    } catch (error: any) {
        console.error('[API] Error deleting agent:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete agent' }, { status: 500 });
    }
}
