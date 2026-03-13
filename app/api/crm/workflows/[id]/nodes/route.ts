import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/crm/workflows/[id]/nodes — Add a node to workflow
export async function POST(request: NextRequest, context: RouteContext) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workflowId } = await context.params;
    const workflow = await prisma.recruitingWorkflow.findFirst({
        where: { id: workflowId, companyId: session.user.companyId },
    });
    if (!workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const body = await request.json();
    const { nodeType, label, config, sortOrder, nextNodeId, yesNodeId, noNodeId } = body;

    if (!nodeType || !label?.trim()) {
        return NextResponse.json(
            { error: 'Node type and label are required' },
            { status: 400 }
        );
    }

    const node = await prisma.workflowNode.create({
        data: {
            workflowId,
            nodeType,
            label: label.trim(),
            config: config || {},
            sortOrder: sortOrder ?? 0,
            nextNodeId: nextNodeId || null,
            yesNodeId: yesNodeId || null,
            noNodeId: noNodeId || null,
        },
    });

    return NextResponse.json(node, { status: 201 });
}
