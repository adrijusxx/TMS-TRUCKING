import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const session = await auth();
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const fullMcWhere = await buildMcNumberWhereClause(session, request);
        const { companyId, ...mcFilter } = fullMcWhere;
        const hasMcFilter = Object.keys(mcFilter).length > 0;

        // Fetch Internal Inspections
        const internalInspections = await prisma.inspection.findMany({
            where: {
                companyId,
                deletedAt: null,
                ...(hasMcFilter
                    ? {
                        OR: [
                            { truck: mcFilter },
                            { driver: mcFilter }
                        ]
                    }
                    : {})
            },
            include: {
                truck: { select: { truckNumber: true } },
                driver: { include: { user: { select: { firstName: true, lastName: true } } } },
            },
            orderBy: { inspectionDate: 'desc' },
            take: 50
        });

        // Fetch Roadside/DOT Inspections
        const roadsideInspections = await prisma.roadsideInspection.findMany({
            where: {
                companyId,
                deletedAt: null,
                ...(hasMcFilter
                    ? {
                        OR: [
                            { truck: mcFilter },
                            { driver: mcFilter }
                        ]
                    }
                    : {})
            },
            include: {
                truck: { select: { truckNumber: true } },
                driver: { include: { user: { select: { firstName: true, lastName: true } } } },
            },
            orderBy: { inspectionDate: 'desc' },
            take: 50
        });

        // Normalize and Combine
        const normalizedInternal = internalInspections.map(i => ({
            id: i.id,
            date: i.inspectionDate,
            type: i.inspectionType,
            vehicle: i.truck.truckNumber,
            driver: i.driver?.user ? `${i.driver.user.firstName} ${i.driver.user.lastName}` : 'Unassigned',
            location: i.location || 'Terminal',
            result: i.status === 'PASSED' ? 'Pass' : 'Fail',
            source: 'INTERNAL'
        }));

        const normalizedRoadside = roadsideInspections.map(i => ({
            id: i.id,
            date: i.inspectionDate,
            type: i.inspectionLevel,
            vehicle: i.truck?.truckNumber || 'N/A',
            driver: i.driver?.user ? `${i.driver.user.firstName} ${i.driver.user.lastName}` : 'Unassigned',
            location: i.inspectionState,
            result: i.outOfService ? 'Out of Service' : (i.violationsFound ? 'Violations' : 'Clean'),
            source: 'DOT'
        }));

        const combined = [...normalizedRoadside, ...normalizedInternal].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return NextResponse.json(combined);
    } catch (error) {
        console.error('[INSPECTIONS_GET]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
