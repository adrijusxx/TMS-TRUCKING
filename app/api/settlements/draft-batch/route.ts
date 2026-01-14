
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { SettlementManager } from '@/lib/managers/SettlementManager';
import { hasPermission, UserRole } from '@/lib/permissions';
import { LoadStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        if (!hasPermission(session.user.role as UserRole, 'settlements.create')) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        // 1. Find all loads ready for settlement
        const pendingLoads = await prisma.load.findMany({
            where: {
                companyId: session.user.companyId,
                status: {
                    in: ['DELIVERED', 'INVOICED', 'PAID', 'BILLING_HOLD', 'READY_TO_BILL'] as LoadStatus[],
                },
                readyForSettlement: true,
                deletedAt: null,
            },
            select: {
                id: true,
                driverId: true,
                // We need fields for calculation
                loadNumber: true,
                status: true,
                revenue: true,
                driverPay: true,
                totalMiles: true,
                loadedMiles: true,
                emptyMiles: true,
                deliveredAt: true,
                pickupDate: true,
                accessorialCharges: {
                    where: { status: { in: ['APPROVED', 'BILLED'] } },
                    include: {
                        // Include details?
                    }
                },
                loadExpenses: {
                    where: { approvalStatus: 'APPROVED' }
                }
            }
        });

        // FETCH EXISTING SETTLED LOADS
        const existingSettlements = await prisma.settlement.findMany({
            where: {
                driver: {
                    companyId: session.user.companyId
                },
                approvalStatus: { not: 'REJECTED' },
            },
            select: { loadIds: true }
        });

        const settledLoadIds = new Set(existingSettlements.flatMap(s => s.loadIds));

        // Filter pending loads that are not already settled
        const validPendingLoads = pendingLoads.filter(l => !settledLoadIds.has(l.id));

        // Group by Driver
        const loadsByDriver: Record<string, typeof validPendingLoads> = {};
        for (const load of validPendingLoads) {
            if (load.driverId) {
                if (!loadsByDriver[load.driverId]) {
                    loadsByDriver[load.driverId] = [];
                }
                loadsByDriver[load.driverId].push(load);
            }
        }

        const validDriverIds = Object.keys(loadsByDriver);
        if (validDriverIds.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        // Fetch drivers details
        const drivers = await prisma.driver.findMany({
            where: {
                id: { in: validDriverIds },
            },
            include: {
                user: {
                    select: { firstName: true, lastName: true, email: true }
                },
                currentTruck: {
                    select: { truckNumber: true }
                }
            }
        });

        const settlementManager = new SettlementManager();
        const draftSettlements = [];

        // Calculate preview for each driver
        for (const driver of drivers) {
            const driverLoads = loadsByDriver[driver.id];
            if (!driverLoads || driverLoads.length === 0) continue;

            // Determine period
            const loadDates = driverLoads
                .map(l => l.deliveredAt || l.pickupDate)
                .filter((d): d is Date => d !== null);

            const periodStart = loadDates.length > 0
                ? new Date(Math.min(...loadDates.map(d => d.getTime())))
                : new Date();
            const periodEnd = loadDates.length > 0
                ? new Date(Math.max(...loadDates.map(d => d.getTime())))
                : new Date();

            try {
                const calculated = await settlementManager.calculateSettlementPreview(
                    driver.id,
                    driverLoads,
                    periodStart,
                    periodEnd
                );

                draftSettlements.push({
                    driver: {
                        id: driver.id,
                        name: `${driver.user?.firstName} ${driver.user?.lastName}`,
                        truckNumber: driver.currentTruck?.truckNumber
                    },
                    period: {
                        start: periodStart,
                        end: periodEnd
                    },
                    loadCount: driverLoads.length,
                    loads: driverLoads.map(l => ({ id: l.id, loadNumber: l.loadNumber, revenue: l.revenue })),
                    ...calculated
                });
            } catch (err) {
                console.error(`Failed to calculate draft for driver ${driver.id}:`, err);
                // Continue to next driver
            }
        }

        return NextResponse.json({
            success: true,
            data: draftSettlements
        });

    } catch (error) {
        console.error('Draft batch error:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch draft batch' } },
            { status: 500 }
        );
    }
}
