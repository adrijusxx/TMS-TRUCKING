import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { hasPermission } from '@/lib/permissions';

/**
 * GET /api/dispatch-view
 * Returns dispatcher dashboard data with assigned drivers, loads, and stats
 * 
 * Query params:
 * - dispatcherId: Optional. For admins to view a specific dispatcher's data
 */
export async function GET(request: NextRequest) {
    try {
        // 1. Auth Check
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        // 2. Permission Check
        if (!hasPermission(session.user.role as any, 'loads.view')) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
                { status: 403 }
            );
        }

        // 3. Build MC Filter
        const mcWhere = await buildMcNumberWhereClause(session, request);
        const { searchParams } = new URL(request.url);

        // 4. Determine which dispatcher to show
        const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
        const requestedDispatcherId = searchParams.get('dispatcherId');

        // If admin and no dispatcher selected, return list of dispatchers
        if (isAdmin && !requestedDispatcherId) {
            const dispatchers = await prisma.user.findMany({
                where: {
                    companyId: mcWhere.companyId,
                    role: { in: ['DISPATCHER', 'ADMIN'] },
                    isActive: true,
                    deletedAt: null,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                },
            });

            // Get driver counts separately for each dispatcher
            const dispatchersWithCounts = await Promise.all(
                dispatchers.map(async (d) => {
                    const driverCount = await prisma.driver.count({
                        where: {
                            assignedDispatcherId: d.id,
                            isActive: true,
                            deletedAt: null,
                        },
                    });
                    return {
                        id: d.id,
                        name: `${d.firstName} ${d.lastName}`,
                        email: d.email,
                        role: d.role,
                        driverCount,
                    };
                })
            );

            return NextResponse.json({
                success: true,
                data: {
                    mode: 'dispatcher-select',
                    dispatchers: dispatchersWithCounts,
                },
            });
        }

        // Use requested dispatcher or current user
        const dispatcherId = isAdmin && requestedDispatcherId
            ? requestedDispatcherId
            : session.user.id;

        // 5. Get dispatcher info
        const dispatcher = await prisma.user.findUnique({
            where: { id: dispatcherId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
            },
        });

        if (!dispatcher) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Dispatcher not found' } },
                { status: 404 }
            );
        }

        // 6. Get assigned drivers with their trucks/trailers
        const drivers = await prisma.driver.findMany({
            where: {
                assignedDispatcherId: dispatcherId,
                ...mcWhere,
                isActive: true,
                deletedAt: null,
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
                currentTruck: {
                    select: {
                        id: true,
                        truckNumber: true,
                        make: true,
                        model: true,
                        samsaraId: true,
                    },
                },
                currentTrailer: {
                    select: {
                        id: true,
                        trailerNumber: true,
                        type: true,
                    },
                },
                mcNumber: {
                    select: {
                        number: true,
                    },
                },
            },
            orderBy: { user: { firstName: 'asc' } },
        });

        // 7. Get load statistics per driver (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const driverIds = drivers.map(d => d.id);

        // Get load counts and stats
        const loadStats = await prisma.load.groupBy({
            by: ['driverId'],
            where: {
                driverId: { in: driverIds },
                deletedAt: null,
                deliveredAt: { gte: thirtyDaysAgo },
            },
            _count: { id: true },
            _sum: { revenue: true, totalMiles: true },
        });

        // Get on-time stats
        const onTimeStats = await prisma.load.groupBy({
            by: ['driverId'],
            where: {
                driverId: { in: driverIds },
                deletedAt: null,
                deliveredAt: { gte: thirtyDaysAgo },
                onTimeDelivery: true,
            },
            _count: { id: true },
        });

        // Get active loads per driver
        const activeLoads = await prisma.load.groupBy({
            by: ['driverId'],
            where: {
                driverId: { in: driverIds },
                deletedAt: null,
                status: { in: ['PENDING', 'ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'] },
            },
            _count: { id: true },
        });

        // Map stats to lookup objects
        const loadStatsMap = new Map(loadStats.map(s => [s.driverId, s]));
        const onTimeMap = new Map(onTimeStats.map(s => [s.driverId, s._count.id]));
        const activeLoadsMap = new Map(activeLoads.map(s => [s.driverId, s._count.id]));

        // 8. Build driver response with stats
        const driversWithStats = drivers.map(driver => {
            const stats = loadStatsMap.get(driver.id);
            const onTimeCount = onTimeMap.get(driver.id) || 0;
            const totalDelivered = stats?._count?.id || 0;
            const onTimePercentage = totalDelivered > 0
                ? Math.round((onTimeCount / totalDelivered) * 100)
                : 100;

            return {
                id: driver.id,
                name: `${driver.user.firstName} ${driver.user.lastName}`,
                phone: driver.user.phone,
                status: driver.status,
                dispatchStatus: driver.dispatchStatus,
                mcNumber: driver.mcNumber?.number || null,
                currentTruck: driver.currentTruck ? {
                    id: driver.currentTruck.id,
                    unitNumber: driver.currentTruck.truckNumber,
                    make: driver.currentTruck.make,
                    model: driver.currentTruck.model,
                    samsaraVehicleId: driver.currentTruck.samsaraId,
                } : null,
                currentTrailer: driver.currentTrailer ? {
                    id: driver.currentTrailer.id,
                    unitNumber: driver.currentTrailer.trailerNumber,
                    type: driver.currentTrailer.type,
                } : null,
                stats: {
                    activeLoads: activeLoadsMap.get(driver.id) || 0,
                    loadsLast30Days: totalDelivered,
                    revenueLast30Days: stats?._sum?.revenue || 0,
                    milesLast30Days: stats?._sum?.totalMiles || 0,
                    onTimePercentage,
                },
            };
        });

        // 9. Calculate summary stats
        const summary = {
            totalDrivers: drivers.length,
            driversAvailable: drivers.filter(d => d.status === 'AVAILABLE').length,
            driversOnRoute: drivers.filter(d =>
                d.status === 'ON_DUTY' || d.dispatchStatus === 'ENROUTE'
            ).length,
            totalActiveLoads: Array.from(activeLoadsMap.values()).reduce((a, b) => a + b, 0),
            totalRevenue30Days: loadStats.reduce((sum, s) => sum + (s._sum?.revenue || 0), 0),
        };

        return NextResponse.json({
            success: true,
            data: {
                mode: 'dashboard',
                dispatcher: {
                    id: dispatcher.id,
                    name: `${dispatcher.firstName} ${dispatcher.lastName}`,
                    email: dispatcher.email,
                },
                drivers: driversWithStats,
                summary,
                isAdmin,
            },
        });

    } catch (error) {
        console.error('Dispatch view fetch error:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Something went wrong',
                },
            },
            { status: 500 }
        );
    }
}
