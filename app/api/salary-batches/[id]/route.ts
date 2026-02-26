import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const batch = await prisma.salaryBatch.findUnique({
            where: {
                id,
                companyId: session.user.companyId,
            },
            include: {
                createdBy: {
                    select: { firstName: true, lastName: true },
                },
                settlements: {
                    include: {
                        driver: {
                            include: {
                                user: { select: { firstName: true, lastName: true } },
                                currentTruck: { select: { id: true, truckNumber: true } },
                            },
                        },
                        deductionItems: true,
                    },
                    orderBy: { settlementNumber: 'asc' },
                },
            },
        });

        if (!batch) {
            return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
        }

        // Fetch load dates for all settlements (loadIds is String[], not a relation)
        const allLoadIds = batch.settlements.flatMap((s) => s.loadIds || []);
        const loads = allLoadIds.length > 0
            ? await prisma.load.findMany({
                where: { id: { in: allLoadIds } },
                select: { id: true, pickupDate: true, deliveryDate: true },
            })
            : [];
        const loadMap = new Map(loads.map((l) => [l.id, l]));

        // Attach earliest pickup and latest delivery per settlement
        const enrichedSettlements = batch.settlements.map((s) => {
            const sLoadIds = s.loadIds || [];
            let earliestPickup: Date | null = null;
            let latestDelivery: Date | null = null;
            for (const lid of sLoadIds) {
                const load = loadMap.get(lid);
                if (!load) continue;
                if (load.pickupDate && (!earliestPickup || load.pickupDate < earliestPickup)) {
                    earliestPickup = load.pickupDate;
                }
                if (load.deliveryDate && (!latestDelivery || load.deliveryDate > latestDelivery)) {
                    latestDelivery = load.deliveryDate;
                }
            }
            return { ...s, pickupDate: earliestPickup, deliveryDate: latestDelivery };
        });

        return NextResponse.json({ success: true, data: { ...batch, settlements: enrichedSettlements } });
    } catch (error) {
        console.error('[SalaryBatch] Get error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH for updating status (e.g., POSTING)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Allow editing batch metadata fields
        const editableFields: Record<string, any> = {};
        if (body.notes !== undefined) editableFields.notes = body.notes;
        if (body.checkDate !== undefined) editableFields.checkDate = body.checkDate ? new Date(body.checkDate) : null;
        if (body.payCompany !== undefined) editableFields.payCompany = body.payCompany;
        if (body.mcNumber !== undefined) editableFields.mcNumber = body.mcNumber;

        if (Object.keys(editableFields).length > 0 && body.status === undefined) {
            const updated = await prisma.salaryBatch.update({
                where: { id, companyId: session.user.companyId },
                data: editableFields,
            });
            return NextResponse.json({ success: true, data: updated });
        }

        // Status transitions
        if (body.status === 'POSTED') {
            // Validate current status
            const currentBatch = await prisma.salaryBatch.findUnique({
                where: { id, companyId: session.user.companyId },
                include: { settlements: true }
            });

            if (!currentBatch) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            if (currentBatch.status !== 'OPEN') return NextResponse.json({ error: 'Batch must be OPEN to post' }, { status: 400 });

            // Update Batch AND Settlements
            const [updatedBatch] = await prisma.$transaction([
                prisma.salaryBatch.update({
                    where: { id },
                    data: {
                        status: 'POSTED',
                        postedAt: new Date(),
                    }
                }),
                // Update all settlements to 'APPROVED' or 'PAID' depending on workflow
                // For now, let's mark them APPROVED so they are locked? Or go straight to generated?
                // The requirement said "Posted = Locked", so distinct from PAID.
                prisma.settlement.updateMany({
                    where: { salaryBatchId: id },
                    data: {
                        status: 'APPROVED',
                        approvalStatus: 'APPROVED'
                    }
                })
            ]);

            return NextResponse.json({ success: true, data: updatedBatch });
        }

        return NextResponse.json({ error: 'Invalid update action' }, { status: 400 });

    } catch (error) {
        console.error('[SalaryBatch] Update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify batch exists and is OPEN (Can't delete POSTED batches easily)
        const batch = await prisma.salaryBatch.findUnique({
            where: { id, companyId: session.user.companyId },
        });

        if (!batch) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (batch.status !== 'OPEN') return NextResponse.json({ error: 'Cannot delete a POSTED or ARCHIVED batch' }, { status: 400 });

        // Cascade delete handled by logic or schema? 
        // SettlementDeduction has onDelete: Cascade so it will be auto-deleted when Settlement is deleted.
        // But we need to handle DriverAdvance reset manually.

        // Step 1: Get all settlement IDs for this batch
        const settlements = await prisma.settlement.findMany({
            where: { salaryBatchId: id },
            select: { id: true }
        });
        const settlementIds = settlements.map(s => s.id);

        // Step 2: Reset driver advances that were deducted in these settlements
        if (settlementIds.length > 0) {
            await prisma.driverAdvance.updateMany({
                where: { settlementId: { in: settlementIds } },
                data: { settlementId: null, deductedAt: null }
            });
        }

        // Step 3: Delete settlements (SettlementDeduction has onDelete: Cascade)
        await prisma.settlement.deleteMany({
            where: { salaryBatchId: id }
        });

        // Step 4: Delete the batch
        await prisma.salaryBatch.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[SalaryBatch] Delete error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
