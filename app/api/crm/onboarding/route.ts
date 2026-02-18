import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

// GET /api/crm/onboarding — List onboarding checklists
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'crm.onboarding.view')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const mcWhere = await buildMcNumberWhereClause(session, request);

        const checklists = await prisma.onboardingChecklist.findMany({
            where: {
                companyId: session.user.companyId,
                ...(status && status !== 'all' ? { status: status as any } : {}),
            },
            include: {
                driver: {
                    select: {
                        id: true, driverNumber: true,
                        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
                    },
                },
                lead: { select: { id: true, leadNumber: true, firstName: true, lastName: true } },
                steps: { orderBy: { sortOrder: 'asc' } },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate progress for each checklist
        const withProgress = checklists.map((c) => {
            const totalSteps = c.steps.length;
            const completedSteps = c.steps.filter((s) => s.status === 'COMPLETED').length;
            const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
            return { ...c, progress, totalSteps, completedSteps };
        });

        return NextResponse.json({ checklists: withProgress });
    } catch (error) {
        console.error('[CRM Onboarding GET] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch onboarding checklists' }, { status: 500 });
    }
}
