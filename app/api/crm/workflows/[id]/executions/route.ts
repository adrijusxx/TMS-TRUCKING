import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/crm/workflows/[id]/executions — List executions for a workflow
export async function GET(_request: NextRequest, context: RouteContext) {
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

    const executions = await prisma.workflowExecution.findMany({
        where: { workflowId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
            lead: {
                select: { firstName: true, lastName: true, leadNumber: true, status: true },
            },
            steps: { orderBy: { executedAt: 'asc' } },
        },
    });

    return NextResponse.json(executions);
}
