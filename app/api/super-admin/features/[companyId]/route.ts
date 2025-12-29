import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/super-admin/features/[companyId]
 * Update feature gates for a specific company
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ companyId: string }> }
) {
    const { companyId } = await params;
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { manualOverride, manualModules } = body;

        // Update subscription
        const updated = await prisma.subscription.update({
            where: { companyId },
            data: {
                manualOverride: manualOverride,
                manualModules: manualModules,
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'UPDATE_FEATURE_GATES',
                entityType: 'Subscription',
                entityId: updated.id,
                metadata: { companyId, manualOverride, manualModules },
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating feature gates:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
