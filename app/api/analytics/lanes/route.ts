import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause, buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { hasPermissionAsync } from '@/lib/server-permissions';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const role = (session.user as any)?.role || 'CUSTOMER';
        if (!(await hasPermissionAsync(role, 'analytics.view'))) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const loadMcWhere = await buildMcNumberWhereClause(session, request);

        // Fetch loads to aggregate
        // Note: For large datasets, this should be optimized to use raw SQL or group by in DB if possible.
        // Prisma doesn't support complex group by on relations easily, so we fetch relevant fields and aggregate in memory for now.
        // Limit to last 6 months for performance/relevance
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const loads = await prisma.load.findMany({
            where: {
                ...loadMcWhere,
                deletedAt: null,
                pickupDate: { gte: sixMonthsAgo },
                // User requested all loads regardless of status
                // status: { in: ['DELIVERED', 'BILLING_HOLD', 'READY_TO_BILL', 'INVOICED', 'PAID'] }
            },
            select: {
                id: true,
                pickupCity: true,
                pickupState: true,
                deliveryCity: true,
                deliveryState: true,
                revenue: true,
                totalMiles: true,
                emptyMiles: true,
            }
        });

        // Aggregate by Route (Origin State -> Dest State)
        const routeMap = new Map<string, {
            origin: string;
            dest: string;
            count: number;
            revenue: number;
            totalMiles: number;
            emptyMiles: number;
        }>();

        for (const load of loads) {
            // Group by State to State for better aggregation volume
            // Can be changed to City-City if higher precision is needed
            const originState = load.pickupState || 'Unknown';
            const destState = load.deliveryState || 'Unknown';
            const key = `${originState} → ${destState}`;

            if (!routeMap.has(key)) {
                routeMap.set(key, {
                    origin: originState,
                    dest: destState,
                    count: 0,
                    revenue: 0,
                    totalMiles: 0,
                    emptyMiles: 0
                });
            }

            const route = routeMap.get(key)!;
            route.count++;
            route.revenue += Number(load.revenue || 0);
            route.totalMiles += Number(load.totalMiles || 0);
            route.emptyMiles += Number(load.emptyMiles || 0);
        }

        // Convert to array and calculate metrics
        const routes = Array.from(routeMap.entries()).map(([name, data]) => {
            const avgMiles = data.count > 0 ? data.totalMiles / data.count : 0;
            const avgRevenue = data.count > 0 ? data.revenue / data.count : 0;
            const rpm = data.totalMiles > 0 ? data.revenue / data.totalMiles : 0;
            // Approximate deadhead
            // Note: True deadhead is complex (distance from prev drop to pickup). 
            // Here we use the recorded 'emptyMiles' on the load if available.
            const deadheadMiles = data.emptyMiles;
            const deadheadPercentage = data.totalMiles > 0 ? (deadheadMiles / data.totalMiles) * 100 : 0;

            let efficiency: 'high' | 'medium' | 'low' = 'medium';
            if (rpm > 2.5 && deadheadPercentage < 10) efficiency = 'high';
            else if (rpm < 1.8 || deadheadPercentage > 20) efficiency = 'low';

            return {
                routeName: name,
                totalLoads: data.count,
                avgMiles: Math.round(avgMiles),
                deadheadMiles: Math.round(deadheadMiles),
                deadheadPercentage: Number(deadheadPercentage.toFixed(1)),
                avgRevenue: Math.round(avgRevenue),
                revenuePerMile: Number(rpm.toFixed(2)),
                efficiency
            };
        });

        // Sort by volume descending
        const sortedRoutes = routes.sort((a, b) => b.totalLoads - a.totalLoads).slice(0, 50);

        return NextResponse.json({ success: true, data: sortedRoutes });

    } catch (error: any) {
        console.error('Lane analytics error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
