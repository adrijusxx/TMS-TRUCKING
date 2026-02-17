import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { hasPermission } from '@/lib/permissions';

/**
 * GET /api/dispatch-view/loads
 * Returns loads for dispatcher's assigned drivers
 * 
 * Query params:
 * - dispatcherId: For admins to view a specific dispatcher's loads
 * - driverId: Filter to a specific driver
 * - status: Filter by load status
 * - limit: Number of loads to return (default 50)
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

        // 4. Determine dispatcher
        const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
        const requestedDispatcherId = searchParams.get('dispatcherId');
        const dispatcherId = isAdmin && requestedDispatcherId
            ? requestedDispatcherId
            : session.user.id;

        // 5. Get driver IDs for this dispatcher
        const driverIdParam = searchParams.get('driverId');

        let driverIds: string[] = [];

        if (driverIdParam) {
            // Verify this driver belongs to the dispatcher
            const driver = await prisma.driver.findFirst({
                where: {
                    id: driverIdParam,
                    assignedDispatcherId: dispatcherId,
                    ...mcWhere,
                    deletedAt: null,
                },
                select: { id: true },
            });

            if (driver) {
                driverIds = [driver.id];
            }
        } else {
            // Get all drivers for this dispatcher
            const drivers = await prisma.driver.findMany({
                where: {
                    assignedDispatcherId: dispatcherId,
                    ...mcWhere,
                    isActive: true,
                    deletedAt: null,
                },
                select: { id: true },
            });
            driverIds = drivers.map(d => d.id);
        }

        if (driverIds.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    loads: [],
                    total: 0,
                },
            });
        }

        // 6. Build load query
        const where: any = {
            ...mcWhere,
            deletedAt: null,
            driverId: { in: driverIds },
        };

        // Status filter
        const status = searchParams.get('status');
        if (status && status !== 'all') {
            if (status === 'active') {
                where.status = {
                    in: ['PENDING', 'ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'],
                };
            } else {
                where.status = status;
            }
        }

        // Date range filter
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        if (startDate && endDate) {
            where.OR = [
                { pickupDate: { gte: new Date(startDate), lte: new Date(endDate) } },
                { deliveryDate: { gte: new Date(startDate), lte: new Date(endDate) } },
            ];
        }

        const limit = parseInt(searchParams.get('limit') || '50', 10);

        // 7. Fetch loads
        const [loads, total] = await Promise.all([
            prisma.load.findMany({
                where,
                include: {
                    driver: {
                        select: {
                            id: true,
                            user: {
                                select: { firstName: true, lastName: true },
                            },
                        },
                    },
                    truck: {
                        select: { id: true, truckNumber: true },
                    },
                    trailer: {
                        select: { id: true, trailerNumber: true },
                    },
                    customer: {
                        select: { id: true, name: true },
                    },
                    stops: {
                        orderBy: { sequence: 'asc' },
                        select: {
                            id: true,
                            stopType: true,
                            sequence: true,
                            company: true,
                            city: true,
                            state: true,
                            status: true,
                            earliestArrival: true,
                            actualArrival: true,
                        },
                    },
                },
                orderBy: [
                    { pickupDate: 'asc' },
                    { createdAt: 'desc' },
                ],
                take: limit,
            }),
            prisma.load.count({ where }),
        ]);

        // 8. Transform response
        const transformedLoads = loads.map(load => ({
            id: load.id,
            loadNumber: load.loadNumber,
            status: load.status,
            dispatchStatus: load.dispatchStatus,
            driver: load.driver ? {
                id: load.driver.id,
                name: load.driver.user ? `${load.driver.user.firstName} ${load.driver.user.lastName}` : 'Unknown',
            } : null,
            truck: load.truck ? {
                id: load.truck.id,
                unitNumber: load.truck.truckNumber,
            } : null,
            trailer: load.trailer ? {
                id: load.trailer.id,
                unitNumber: load.trailer.trailerNumber,
            } : null,
            customer: load.customer,
            pickup: {
                city: load.pickupCity,
                state: load.pickupState,
                date: load.pickupDate,
                company: load.pickupCompany,
            },
            delivery: {
                city: load.deliveryCity,
                state: load.deliveryState,
                date: load.deliveryDate,
                company: load.deliveryCompany,
            },
            stops: load.stops,
            revenue: load.revenue,
            totalMiles: load.totalMiles,
        }));

        return NextResponse.json({
            success: true,
            data: {
                loads: transformedLoads,
                total,
            },
        });

    } catch (error) {
        console.error('Dispatch loads fetch error:', error);
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
