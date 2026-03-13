import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/crm/workflows — List recruiting workflows
export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflows = await prisma.recruitingWorkflow.findMany({
        where: { companyId: session.user.companyId },
        orderBy: { createdAt: 'desc' },
        include: {
            createdBy: { select: { firstName: true, lastName: true } },
            _count: { select: { nodes: true, executions: true } },
        },
    });

    return NextResponse.json(workflows);
}

// POST /api/crm/workflows — Create a recruiting workflow
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, triggerType, triggerValue } = body;

    if (!name?.trim() || !triggerType) {
        return NextResponse.json(
            { error: 'Name and trigger type are required' },
            { status: 400 }
        );
    }

    const workflow = await prisma.recruitingWorkflow.create({
        data: {
            companyId: session.user.companyId,
            name: name.trim(),
            description: description?.trim() || null,
            triggerType,
            triggerValue: triggerValue || {},
            createdById: session.user.id,
        },
        include: { nodes: true },
    });

    return NextResponse.json(workflow, { status: 201 });
}
