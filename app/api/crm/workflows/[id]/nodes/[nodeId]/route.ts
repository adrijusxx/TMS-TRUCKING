import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = { params: Promise<{ id: string; nodeId: string }> };

// PATCH /api/crm/workflows/[id]/nodes/[nodeId] — Update a node
export async function PATCH(request: NextRequest, context: RouteContext) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workflowId, nodeId } = await context.params;
    const workflow = await prisma.recruitingWorkflow.findFirst({
        where: { id: workflowId, companyId: session.user.companyId },
    });
    if (!workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const body = await request.json();
    const { label, config, sortOrder, nextNodeId, yesNodeId, noNodeId } = body;

    const node = await prisma.workflowNode.update({
        where: { id: nodeId },
        data: {
            ...(label !== undefined && { label: label.trim() }),
            ...(config !== undefined && { config }),
            ...(sortOrder !== undefined && { sortOrder }),
            ...(nextNodeId !== undefined && { nextNodeId }),
            ...(yesNodeId !== undefined && { yesNodeId }),
            ...(noNodeId !== undefined && { noNodeId }),
        },
    });

    return NextResponse.json(node);
}

// DELETE /api/crm/workflows/[id]/nodes/[nodeId] — Remove a node
export async function DELETE(_request: NextRequest, context: RouteContext) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workflowId, nodeId } = await context.params;
    const workflow = await prisma.recruitingWorkflow.findFirst({
        where: { id: workflowId, companyId: session.user.companyId },
    });
    if (!workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    await prisma.workflowNode.delete({ where: { id: nodeId } });
    return NextResponse.json({ success: true });
}
