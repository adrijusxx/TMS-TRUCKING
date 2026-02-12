import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { SettlementManager } from '@/lib/managers/SettlementManager';
import { DriverStatus } from '@prisma/client';

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
        console.error('[SalaryBatches] List error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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

        // 2. Identify Drivers with Loads in Period
        const drivers = await prisma.driver.findMany({
            where: {
                companyId: session.user.companyId,
                status: { not: 'INACTIVE' as DriverStatus }, // Ensure we process active/available drivers
                deletedAt: null,
            },
        });

        const manager = new SettlementManager();
        let settlementsCreated = 0;
        let totalGeneratedAmount = 0;
        const errors = [];

        // 3. Loop and Generate
        for (const driver of drivers) {
            try {
                // Check if there are any loads for this driver in this period
                // We do this check here to avoid "No loads found" errors clogging logs
                // and to skip drivers who didn't work.
                const loadCount = await prisma.load.count({
                    where: {
                        driverId: driver.id,
                        companyId: session.user.companyId,
                        deletedAt: null,
                        status: { in: ['DELIVERED', 'INVOICED', 'PAID', 'BILLING_HOLD', 'READY_TO_BILL'] },
                        AND: [
                            {
                                OR: [
                                    {
                                        deliveredAt: {
                                            gte: periodStart,
                                            lte: periodEnd,
                                        },
                                    },
                                    {
                                        deliveredAt: null,
                                        updatedAt: {
                                            gte: periodStart,
                                            lte: periodEnd,
                                        },
                                    },
                                ],
                            },
                            {
                                OR: [
                                    { readyForSettlement: true },
                                    { status: { in: ['INVOICED', 'PAID'] } }
                                ],
                            }
                        ],
                    }
                });

                if (loadCount === 0) continue;

                const settlement = await manager.generateSettlement({
                    driverId: driver.id,
                    periodStart,
                    periodEnd,
                    notes: `Batch ${batchNumber}`,
                    salaryBatchId: batch.id,
                });

                if (settlement) {
                    settlementsCreated++;
                    totalGeneratedAmount += settlement.netPay;
                }

            } catch (err: any) {
                // If it's just "No completed loads", ignore. Otherwise log.
                if (err.message !== 'No completed loads found for the settlement period') {
                    console.warn(`[Batch Generate] Failed for driver ${driver.driverNumber}:`, err.message);
                    errors.push({ driver: driver.driverNumber, error: err.message });
                }
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
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation Error', details: error.issues }, { status: 400 });
        }
        console.error('[SalaryBatches] Create error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
