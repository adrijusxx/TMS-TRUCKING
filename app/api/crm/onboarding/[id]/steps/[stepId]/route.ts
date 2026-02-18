import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// PATCH /api/crm/onboarding/[id]/steps/[stepId] — Complete/uncomplete a step
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; stepId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'crm.onboarding.manage')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const { id, stepId } = await params;
        const body = await request.json();

        // Verify step belongs to this checklist
        const step = await prisma.onboardingStep.findFirst({
            where: { id: stepId, checklistId: id },
        });

        if (!step) {
            return NextResponse.json({ error: 'Step not found' }, { status: 404 });
        }

        const isCompleting = body.status === 'COMPLETED';

        const updated = await prisma.onboardingStep.update({
            where: { id: stepId },
            data: {
                status: body.status,
                notes: body.notes !== undefined ? body.notes : step.notes,
                completedAt: isCompleting ? new Date() : null,
                completedById: isCompleting ? session.user.id : null,
            },
        });

        // Auto-update checklist status based on step progress
        const allSteps = await prisma.onboardingStep.findMany({
            where: { checklistId: id },
        });
        const completedCount = allSteps.filter((s) => s.status === 'COMPLETED').length;
        const requiredSteps = allSteps.filter((s) => s.required);
        const requiredCompleted = requiredSteps.filter((s) => s.status === 'COMPLETED').length;

        let checklistStatus: string | undefined;
        if (completedCount === allSteps.length) {
            checklistStatus = 'COMPLETED';
        } else if (completedCount > 0) {
            checklistStatus = 'IN_PROGRESS';
        }

        if (checklistStatus) {
            await prisma.onboardingChecklist.update({
                where: { id },
                data: {
                    status: checklistStatus as any,
                    ...(checklistStatus === 'IN_PROGRESS' ? { startedAt: new Date() } : {}),
                    ...(checklistStatus === 'COMPLETED' ? { completedAt: new Date() } : {}),
                },
            });
        }

        return NextResponse.json({
            step: updated,
            progress: {
                total: allSteps.length,
                completed: completedCount,
                requiredTotal: requiredSteps.length,
                requiredCompleted,
            },
        });
    } catch (error) {
        console.error('[CRM Onboarding Step PATCH] Error:', error);
        return NextResponse.json({ error: 'Failed to update step' }, { status: 500 });
    }
}
