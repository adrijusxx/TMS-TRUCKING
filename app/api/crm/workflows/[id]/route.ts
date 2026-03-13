import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/crm/workflows/[id] — Get workflow with nodes
export async function GET(_request: NextRequest, context: RouteContext) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const workflow = await prisma.recruitingWorkflow.findFirst({
        where: { id, companyId: session.user.companyId },
        include: {
            nodes: { orderBy: { sortOrder: 'asc' } },
            createdBy: { select: { firstName: true, lastName: true } },
            _count: { select: { executions: true } },
        },
    });

    if (!workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json(workflow);
}

// PATCH /api/crm/workflows/[id] — Update workflow
export async function PATCH(request: NextRequest, context: RouteContext) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { name, description, isActive, mode, triggerType, triggerValue } = body;

    const existing = await prisma.recruitingWorkflow.findFirst({
        where: { id, companyId: session.user.companyId },
    });
    if (!existing) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const workflow = await prisma.recruitingWorkflow.update({
        where: { id },
        data: {
            ...(name !== undefined && { name: name.trim() }),
            ...(description !== undefined && { description: description?.trim() || null }),
            ...(isActive !== undefined && { isActive }),
            ...(mode !== undefined && { mode }),
            ...(triggerType !== undefined && { triggerType }),
            ...(triggerValue !== undefined && { triggerValue }),
        },
        include: { nodes: { orderBy: { sortOrder: 'asc' } } },
    });

    return NextResponse.json(workflow);
}

// DELETE /api/crm/workflows/[id] — Delete workflow
export async function DELETE(_request: NextRequest, context: RouteContext) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.recruitingWorkflow.findFirst({
        where: { id, companyId: session.user.companyId },
    });
    if (!existing) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    await prisma.recruitingWorkflow.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
