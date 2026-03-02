import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface SafetyEvent {
  id: string;
  type: 'accident' | 'claim' | 'inspection';
  date: string;
  title: string;
  description: string;
  status: string;
  severity?: string;
  truckNumber?: string;
  details: Record<string, unknown>;
}

/**
 * GET /api/drivers/[id]/safety-history
 * Consolidates all safety events for a driver: accidents, claims, inspections.
 * Query params: type (accident|claim|inspection), dateFrom, dateTo
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: driverId } = await params;

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const companyId = session.user.companyId;

    // Verify driver belongs to company
    const driver = await prisma.driver.findFirst({
      where: { id: driverId, companyId, deletedAt: null },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build date range filter
    const dateRange: { gte?: Date; lte?: Date } = {};
    if (dateFrom) dateRange.gte = new Date(dateFrom);
    if (dateTo) dateRange.lte = new Date(dateTo);
    const hasDateFilter = Object.keys(dateRange).length > 0;

    // Query all three sources in parallel
    const [incidents, claims, inspections] = await Promise.all([
      prisma.safetyIncident.findMany({
        where: {
          driverId,
          companyId,
          ...(hasDateFilter && { date: dateRange }),
        },
        include: {
          driver: { include: { user: true } },
          truck: true,
        },
        orderBy: { date: 'desc' },
      }),
      prisma.insuranceClaim.findMany({
        where: {
          driverId,
          companyId,
          deletedAt: null,
          ...(hasDateFilter && { dateOfLoss: dateRange }),
        },
        include: {
          driver: { include: { user: true } },
          truck: true,
        },
        orderBy: { dateOfLoss: 'desc' },
      }),
      prisma.roadsideInspection.findMany({
        where: {
          driverId,
          companyId,
          deletedAt: null,
          ...(hasDateFilter && { inspectionDate: dateRange }),
        },
        include: {
          driver: { include: { user: true } },
          truck: true,
        },
        orderBy: { inspectionDate: 'desc' },
      }),
    ]);

    // Normalize into unified events
    let events: SafetyEvent[] = [];

    if (!typeFilter || typeFilter === 'accident') {
      events.push(
        ...incidents.map((inc) => ({
          id: inc.id,
          type: 'accident' as const,
          date: inc.date.toISOString(),
          title: `${inc.incidentType} - ${inc.incidentNumber}`,
          description: inc.description,
          status: inc.status,
          severity: inc.severity,
          truckNumber: inc.truck?.truckNumber ?? undefined,
          details: {
            location: inc.location,
            city: inc.city,
            state: inc.state,
            injuriesInvolved: inc.injuriesInvolved,
            fatalitiesInvolved: inc.fatalitiesInvolved,
            estimatedCost: inc.estimatedCost,
            dotReportable: inc.dotReportable,
          },
        }))
      );
    }

    if (!typeFilter || typeFilter === 'claim') {
      events.push(
        ...claims.map((claim) => ({
          id: claim.id,
          type: 'claim' as const,
          date: claim.dateOfLoss.toISOString(),
          title: `${claim.claimType} - ${claim.claimNumber}`,
          description: `${claim.insuranceCompany} - ${claim.coverageType ?? 'N/A'}`,
          status: claim.status,
          severity: undefined,
          truckNumber: claim.truck?.truckNumber ?? undefined,
          details: {
            claimType: claim.claimType,
            insuranceCompany: claim.insuranceCompany,
            estimatedLoss: claim.estimatedLoss,
            paidAmount: claim.paidAmount,
            settlementAmount: claim.settlementAmount,
            coverageType: claim.coverageType,
          },
        }))
      );
    }

    if (!typeFilter || typeFilter === 'inspection') {
      events.push(
        ...inspections.map((insp) => ({
          id: insp.id,
          type: 'inspection' as const,
          date: insp.inspectionDate.toISOString(),
          title: `Level ${insp.inspectionLevel} - ${insp.inspectionLocation}`,
          description: insp.note ?? `${insp.inspectionState} inspection`,
          status: insp.inspectionStatus ?? 'COMPLETED',
          severity: insp.outOfService ? 'CRITICAL' : undefined,
          truckNumber: insp.truck?.truckNumber ?? undefined,
          details: {
            inspectionLevel: insp.inspectionLevel,
            inspectionState: insp.inspectionState,
            violationsFound: insp.violationsFound,
            outOfService: insp.outOfService,
            oosReason: insp.oosReason,
          },
        }))
      );
    }

    // Sort all events by date descending
    events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({
      data: events,
      meta: { totalCount: events.length },
    });
  } catch (error) {
    console.error('Error fetching driver safety history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch safety history' },
      { status: 500 }
    );
  }
}
