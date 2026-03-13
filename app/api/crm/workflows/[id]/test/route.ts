import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WorkflowExecutionManager } from '@/lib/managers/WorkflowExecutionManager';

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/crm/workflows/[id]/test — Run workflow in sandbox mode
export async function POST(request: NextRequest, context: RouteContext) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workflowId } = await context.params;
    const workflow = await prisma.recruitingWorkflow.findFirst({
        where: { id: workflowId, companyId: session.user.companyId },
        include: { nodes: true },
    });
    if (!workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (workflow.nodes.length === 0) {
        return NextResponse.json(
            { error: 'Workflow has no nodes. Add at least one action node.' },
            { status: 400 }
        );
    }

    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
        return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }

    const lead = await prisma.lead.findFirst({
        where: { id: leadId, companyId: session.user.companyId },
    });
    if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Delete any existing test execution for this workflow+lead
    await prisma.workflowExecution.deleteMany({
        where: { workflowId, leadId },
    });

    // Run the workflow synchronously for sandbox testing
    await WorkflowExecutionManager.startWorkflow(workflowId, leadId, session.user.companyId);

    // Fetch execution results
    const execution = await prisma.workflowExecution.findUnique({
        where: { workflowId_leadId: { workflowId, leadId } },
        include: {
            steps: { orderBy: { executedAt: 'asc' } },
        },
    });

    return NextResponse.json(execution);
}
