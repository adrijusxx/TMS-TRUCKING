import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/fleet/maintenance/schedules/[id]
 * Update a maintenance schedule
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
        }

        const body = await request.json();
        const { intervalMiles, intervalMonths, isActive, active } = body;
        const { id } = await params;

        const schedule = await prisma.maintenanceSchedule.update({
            where: {
                id,
                companyId: session.user.companyId,
            },
            data: {
                intervalMiles: intervalMiles !== undefined ? parseInt(intervalMiles) : undefined,
                intervalMonths: intervalMonths !== undefined ? parseInt(intervalMonths) : undefined,
                isActive: isActive !== undefined ? isActive : undefined,
                active: active !== undefined ? active : undefined,
            },
        });

        return NextResponse.json({ success: true, data: schedule });
    } catch (error: any) {
        console.error('Error updating schedule:', error);
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    }
}

/**
 * DELETE /api/fleet/maintenance/schedules/[id]
 * Delete a maintenance schedule (soft delete)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
        }

        const { id } = await params;

        const schedule = await prisma.maintenanceSchedule.update({
            where: {
                id,
                companyId: session.user.companyId,
            },
            data: {
                isActive: false,
                deletedAt: new Date(),
            },
        });

        return NextResponse.json({ success: true, data: schedule });
    } catch (error: any) {
        console.error('Error deleting schedule:', error);
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    }
}
