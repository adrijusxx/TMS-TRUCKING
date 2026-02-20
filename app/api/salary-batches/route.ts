import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { SettlementManager } from '@/lib/managers/SettlementManager';
import { DriverStatus } from '@prisma/client';
import { handleApiError } from '@/lib/api/route-helpers';

const createBatchSchema = z.object({
    periodStart: z.string().datetime(),
    periodEnd: z.string().datetime(),
    notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const batches = await prisma.salaryBatch.findMany({
            where: {
                companyId: session.user.companyId,
            },
            include: {
                createdBy: {
                    select: { firstName: true, lastName: true },
                },
                _count: {
                    select: { settlements: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, data: batches });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validated = createBatchSchema.parse(body);
        const periodStart = new Date(validated.periodStart);
        const periodEnd = new Date(validated.periodEnd);

        // Ensure the end date includes the full day (e.g. 23:59:59)
        // This prevents loads delivered on the last day from being excluded due to time boundaries.
        if (periodEnd.getUTCHours() === 0 && periodEnd.getUTCMinutes() === 0) {
            periodEnd.setUTCHours(23, 59, 59, 999);
        }

        const notes = validated.notes;

        // 1. Create the Batch Header
        const batchNumber = `BATCH-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

        // START TRANSACTION (Implicit implementation via logic flow first, simplified for MVP)
        // Ideally we wrap in prisma.$transaction, but generating settlements calls other transactions.

        const batch = await prisma.salaryBatch.create({
            data: {
                companyId: session.user.companyId,
                batchNumber,
                periodStart,
                periodEnd,
                notes,
                createdById: session.user.id,
                status: 'OPEN',
            },
        });

        // 2. Identify Drivers with unsettled loads
        const drivers = await prisma.driver.findMany({
            where: {
                companyId: session.user.companyId,
                status: { not: 'INACTIVE' as DriverStatus },
                deletedAt: null,
            },
            select: { id: true, driverNumber: true },
        });

        const manager = new SettlementManager();
        let settlementsCreated = 0;
        let totalGeneratedAmount = 0;
        const errors = [];

        // 3. Loop and Generate — use load-ID-based dedup (same pattern as processCompanySettlements)
        for (const driver of drivers) {
            try {
                // Fetch load IDs already in active (non-rejected) settlements
                const existingSettlements = await prisma.settlement.findMany({
                    where: { driverId: driver.id, approvalStatus: { not: 'REJECTED' } },
                    select: { loadIds: true },
                });
                const settledLoadIds = new Set(existingSettlements.flatMap(s => s.loadIds));

                // Find eligible loads — same criteria as Orchestrator and draft-batch
                const eligibleLoads = await prisma.load.findMany({
                    where: {
                        driverId: driver.id,
                        companyId: session.user.companyId,
                        deletedAt: null,
                        status: { in: ['DELIVERED', 'INVOICED', 'PAID', 'BILLING_HOLD', 'READY_TO_BILL'] },
                        OR: [
                            { readyForSettlement: true },
                            { status: { in: ['INVOICED', 'PAID'] } },
                        ],
                    },
                    select: { id: true },
                });

                // Exclude already-settled loads
                const unsettledLoads = eligibleLoads.filter(l => !settledLoadIds.has(l.id));
                if (unsettledLoads.length === 0) continue;

                const settlement = await manager.generateSettlement({
                    driverId: driver.id,
                    periodStart,
                    periodEnd,
                    loadIds: unsettledLoads.map(l => l.id),
                    forceIncludeNotReady: true,
                    notes: `Batch ${batchNumber}`,
                    salaryBatchId: batch.id,
                });

                if (settlement) {
                    settlementsCreated++;
                    totalGeneratedAmount += settlement.netPay;
                }

            } catch (err: any) {
                console.warn(`[Batch Generate] Failed for driver ${driver.driverNumber}:`, err.message);
                errors.push({ driver: driver.driverNumber, error: err.message });
            }
        }

        // 4. Update Batch Stats
        const updatedBatch = await prisma.salaryBatch.update({
            where: { id: batch.id },
            data: {
                settlementCount: settlementsCreated,
                totalAmount: totalGeneratedAmount,
            },
            include: {
                settlements: true, // Return settlements for immediate display? Limit size?
            }
        });

        return NextResponse.json({
            success: true,
            data: updatedBatch,
            meta: {
                driversProcessed: drivers.length,
                settlementsCreated,
                errors
            }
        });

    } catch (error) {
        return handleApiError(error);
    }
}
