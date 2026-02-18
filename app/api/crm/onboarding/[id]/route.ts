import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// GET /api/crm/onboarding/[id] — Get checklist detail
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const checklist = await prisma.onboardingChecklist.findFirst({
            where: { id, companyId: session.user.companyId },
            include: {
                driver: {
                    select: {
                        id: true, driverNumber: true,
                        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
                    },
                },
                lead: { select: { id: true, leadNumber: true, firstName: true, lastName: true } },
                steps: {
                    orderBy: { sortOrder: 'asc' },
                    include: { completedBy: { select: { firstName: true, lastName: true } } },
                },
            },
        });

        if (!checklist) {
            return NextResponse.json({ error: 'Checklist not found' }, { status: 404 });
        }

        return NextResponse.json({ checklist });
    } catch (error) {
        console.error('[CRM Onboarding Detail GET] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 });
    }
}

// PATCH /api/crm/onboarding/[id] — Update checklist status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'crm.onboarding.manage')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();

        const checklist = await prisma.onboardingChecklist.update({
            where: { id },
            data: {
                status: body.status,
                ...(body.status === 'IN_PROGRESS' && !body.startedAt ? { startedAt: new Date() } : {}),
                ...(body.status === 'COMPLETED' ? { completedAt: new Date() } : {}),
            },
        });

        return NextResponse.json({ checklist });
    } catch (error) {
        console.error('[CRM Onboarding Detail PATCH] Error:', error);
        return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 });
    }
}
