import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/loads/bulk-assign-driver
 * 
 * Bulk assign a driver to multiple loads (for testing/data fix purposes)
 * 
 * Body: { loadIds: string[], driverId: string }
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        // Only allow ADMIN, SUPER_ADMIN, or DISPATCHER
        const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'DISPATCHER'];
        if (!allowedRoles.includes(session.user.role as string)) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
                },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { loadIds, driverId } = body;

        if (!Array.isArray(loadIds) || loadIds.length === 0) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'loadIds array is required' } },
                { status: 400 }
            );
        }

        if (!driverId) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'driverId is required' } },
                { status: 400 }
            );
        }

        // Verify driver exists and belongs to company
        const driver = await prisma.driver.findFirst({
            where: {
                id: driverId,
                companyId: session.user.companyId,
                deletedAt: null,
            },
            select: {
                id: true,
                driverNumber: true,
                payType: true,
                payRate: true,
                user: {
                    select: { firstName: true, lastName: true },
                },
            },
        });

        if (!driver) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } },
                { status: 404 }
            );
        }

        // Update all loads with the driver
        const updateResult = await prisma.load.updateMany({
            where: {
                id: { in: loadIds },
                companyId: session.user.companyId,
                deletedAt: null,
            },
            data: {
                driverId: driver.id,
            },
        });

        // Now calculate driver pay for each load individually
        const updatedLoads = await prisma.load.findMany({
            where: { id: { in: loadIds } },
            select: {
                id: true,
                loadNumber: true,
                totalMiles: true,
                loadedMiles: true,
                emptyMiles: true,
                revenue: true,
                status: true,
            },
        });

        // Calculate and update driver pay for each load
        let payUpdated = 0;
        if (driver.payType && driver.payRate !== null) {
            for (const load of updatedLoads) {
                let calculatedPay = 0;
                const miles = load.totalMiles || load.loadedMiles || (load.emptyMiles || 0);

                switch (driver.payType) {
                    case 'PER_MILE':
                        calculatedPay = miles * driver.payRate;
                        break;
                    case 'PER_LOAD':
                        calculatedPay = driver.payRate;
                        break;
                    case 'PERCENTAGE':
                        calculatedPay = (load.revenue || 0) * (driver.payRate / 100);
                        break;
                    case 'HOURLY':
                        const estimatedHours = miles > 0 ? miles / 50 : 10;
                        calculatedPay = estimatedHours * driver.payRate;
                        break;
                }

                if (calculatedPay > 0) {
                    await prisma.load.update({
                        where: { id: load.id },
                        data: { driverPay: calculatedPay },
                    });
                    payUpdated++;
                }
            }
        }

        // Also mark DELIVERED loads as ready for settlement
        const settledResult = await prisma.load.updateMany({
            where: {
                id: { in: loadIds },
                status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
                readyForSettlement: false,
            },
            data: {
                readyForSettlement: true,
                deliveredAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                loadsUpdated: updateResult.count,
                driverPayCalculated: payUpdated,
                settlementsReady: settledResult.count,
                driver: {
                    id: driver.id,
                    name: `${driver.user?.firstName} ${driver.user?.lastName}`,
                    driverNumber: driver.driverNumber,
                },
            },
            message: `Assigned driver to ${updateResult.count} loads, calculated pay for ${payUpdated} loads, marked ${settledResult.count} loads ready for settlement`,
        });
    } catch (error: any) {
        console.error('Error bulk assigning driver:', error);
        return NextResponse.json(
            {
                success: false,
                error: { code: 'INTERNAL_ERROR', message: error.message || 'Something went wrong' },
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/loads/bulk-assign-driver
 * 
 * Get loads without drivers assigned (for diagnostic purposes)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        // Get delivered loads without drivers
        const loadsWithoutDrivers = await prisma.load.findMany({
            where: {
                companyId: session.user.companyId,
                status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
                driverId: null,
                deletedAt: null,
            },
            select: {
                id: true,
                loadNumber: true,
                status: true,
                revenue: true,
                totalMiles: true,
                deliveryDate: true,
            },
            orderBy: { deliveryDate: 'desc' },
            take: 50,
        });

        // Get all active drivers for reference
        const drivers = await prisma.driver.findMany({
            where: {
                companyId: session.user.companyId,
                isActive: true,
                deletedAt: null,
            },
            select: {
                id: true,
                driverNumber: true,
                payType: true,
                payRate: true,
                user: {
                    select: { firstName: true, lastName: true },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                loadsWithoutDrivers: loadsWithoutDrivers.length,
                loads: loadsWithoutDrivers,
                availableDrivers: drivers.map(d => ({
                    id: d.id,
                    name: `${d.user?.firstName} ${d.user?.lastName}`,
                    driverNumber: d.driverNumber,
                    payType: d.payType,
                    payRate: d.payRate,
                })),
            },
        });
    } catch (error: any) {
        console.error('Error getting loads without drivers:', error);
        return NextResponse.json(
            {
                success: false,
                error: { code: 'INTERNAL_ERROR', message: error.message || 'Something went wrong' },
            },
            { status: 500 }
        );
    }
}
