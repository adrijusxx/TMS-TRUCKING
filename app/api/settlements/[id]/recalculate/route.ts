
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { SettlementManager } from '@/lib/managers/SettlementManager';
import { hasPermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/api/route-helpers';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        if (!hasPermission(session.user.role, 'settlements.edit')) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
                { status: 403 }
            );
        }

        const resolvedParams = await params;
        const settlementId = resolvedParams.id;

        const settlementManager = new SettlementManager();
        const updatedSettlement = await settlementManager.recalculateSettlement(settlementId);

        return NextResponse.json({
            success: true,
            data: updatedSettlement,
            message: 'Settlement recalculated successfully',
        });
    } catch (error) {
        return handleApiError(error);
    }
}
