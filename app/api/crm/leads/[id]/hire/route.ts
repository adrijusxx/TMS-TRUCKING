import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { LeadConversionManager } from '@/lib/managers/LeadConversionManager';

// POST /api/crm/leads/[id]/hire — Convert a lead to a driver
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'crm.hire')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json().catch(() => ({}));

        const manager = new LeadConversionManager(prisma);
        const result = await manager.convert({
            leadId: id,
            companyId: session.user.companyId,
            userId: session.user.id,
            payType: body.payType,
            payRate: body.payRate ? parseFloat(body.payRate) : undefined,
            driverType: body.driverType,
            mcNumberId: body.mcNumberId,
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            driverId: result.driverId,
            checklistId: result.checklistId,
        });
    } catch (error) {
        console.error('[CRM Lead Hire] Error:', error);
        return NextResponse.json({ error: 'Failed to convert lead' }, { status: 500 });
    }
}
