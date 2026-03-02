import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { NextRequest, NextResponse } from 'next/server';

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

        return NextResponse.json({
            data: combined,
            meta: { totalCount: combined.length, page: 1, totalPages: 1 },
        });
    } catch (error) {
        console.error('[INSPECTIONS_GET]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.companyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const inspection = await prisma.roadsideInspection.create({
            data: {
                companyId: session.user.companyId,
                inspectionLevel: body.inspectionLevel || 'LEVEL_1',
                inspectionDate: new Date(body.inspectionDate),
                inspectionLocation: body.inspectionLocation || '',
                inspectionState: body.inspectionState || '',
                inspectorName: body.inspectorName || null,
                inspectorBadgeNumber: body.inspectorBadgeNumber || null,
                violationsFound: body.violationsFound ?? false,
                outOfService: body.outOfService ?? false,
                oosReason: body.oosReason || null,
                recordable: body.recordable ?? false,
                totalCharge: body.totalCharge ? parseFloat(body.totalCharge) : null,
                totalFee: body.totalFee ? parseFloat(body.totalFee) : null,
                note: body.note || null,
                driverId: body.driverId || null,
                truckId: body.truckId || null,
                trailerId: body.trailerId || null,
            },
            include: {
                driver: { include: { user: { select: { firstName: true, lastName: true } } } },
                truck: { select: { truckNumber: true } },
            },
        });

        return NextResponse.json({ data: inspection }, { status: 201 });
    } catch (error) {
        console.error('[INSPECTIONS_POST]', error);
        return NextResponse.json({ error: 'Failed to create inspection' }, { status: 500 });
    }
}
