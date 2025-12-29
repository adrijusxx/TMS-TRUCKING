import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const updateMaintenanceSchema = z.object({
    type: z.enum(['PM_A', 'PM_B', 'TIRES', 'REPAIR']).optional(),
    description: z.string().min(1).optional(),
    cost: z.number().nonnegative().optional(),
    odometer: z.number().nonnegative().optional(),
    date: z.string().datetime().optional().nullable(),
    nextServiceDate: z.string().datetime().optional().nullable(),
    vendorId: z.string().optional().nullable(),
    invoiceNumber: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

/**
 * GET /api/maintenance/[id]
 * Get a single maintenance record
 */
export async function GET(
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

        const { id } = await params;

        const record = await prisma.maintenanceRecord.findFirst({
            where: {
                id,
                truck: {
                    companyId: session.user.companyId,
                },
            },
            include: {
                truck: {
                    select: {
                        id: true,
                        truckNumber: true,
                        make: true,
                        model: true,
                    },
                },
            },
        });

        if (!record) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Record not found' } },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: record,
        });
    } catch (error: any) {
        console.error('Error fetching maintenance record:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/maintenance/[id]
 * Update a maintenance record
 */
export async function PATCH(
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

        if (!hasPermission(session.user.role, 'trucks.edit')) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const validatedData = updateMaintenanceSchema.parse(body);

        // Verify record belongs to company
        const existingRecord = await prisma.maintenanceRecord.findFirst({
            where: {
                id,
                truck: {
                    companyId: session.user.companyId,
                },
            },
        });

        if (!existingRecord) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Record not found' } },
                { status: 404 }
            );
        }

        const updateData: any = { ...validatedData };
        if (validatedData.date) updateData.date = new Date(validatedData.date);
        if (validatedData.nextServiceDate) updateData.nextServiceDate = new Date(validatedData.nextServiceDate);

        const record = await prisma.maintenanceRecord.update({
            where: { id },
            data: updateData,
            include: {
                truck: true,
            },
        });

        // Update truck info if date or odometer changed
        if (record.date || record.odometer) {
            await prisma.truck.update({
                where: { id: record.truckId },
                data: {
                    lastMaintenance: record.date,
                    odometerReading: record.odometer,
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: record,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', details: error.issues } },
                { status: 400 }
            );
        }

        console.error('Error updating maintenance record:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/maintenance/[id]
 * Delete a maintenance record
 */
export async function DELETE(
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

        if (!hasPermission(session.user.role, 'trucks.edit')) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Verify record belongs to company
        const record = await prisma.maintenanceRecord.findFirst({
            where: {
                id,
                truck: {
                    companyId: session.user.companyId,
                },
            },
        });

        if (!record) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Record not found' } },
                { status: 404 }
            );
        }

        await prisma.maintenanceRecord.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: 'Record deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting maintenance record:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
