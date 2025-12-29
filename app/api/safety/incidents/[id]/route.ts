import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const incident = await prisma.safetyIncident.findUnique({
      where: { id },
      include: {
        driver: {
          include: {
            user: true
          }
        },
        truck: true,
        load: true,
        investigation: {
          include: {
            documents: true
          }
        },
        preventableDetermination: true,
        policeReports: {
          include: {
            document: true
          }
        },
        witnessStatements: {
          include: {
            document: true
          }
        },
        accidentPhotos: {
          include: {
            document: true
          }
        },
        insuranceClaims: true
      }
    });

    if (!incident || incident.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json({ incident });
  } catch (error) {
    console.error('Error fetching incident:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incident' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify incident belongs to company
    const existing = await prisma.safetyIncident.findUnique({
      where: { id },
      select: { companyId: true }
    });

    if (!existing || existing.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const incident = await prisma.safetyIncident.update({
      where: { id },
      data: {
        ...(body.incidentType && { incidentType: body.incidentType }),
        ...(body.severity && { severity: body.severity }),
        ...(body.date && { date: new Date(body.date) }),
        ...(body.location && { location: body.location }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.state !== undefined && { state: body.state }),
        ...(body.description && { description: body.description }),
        ...(body.driverId !== undefined && { driverId: body.driverId }),
        ...(body.truckId !== undefined && { truckId: body.truckId }),
        ...(body.loadId !== undefined && { loadId: body.loadId }),
        ...(body.injuriesInvolved !== undefined && { injuriesInvolved: body.injuriesInvolved }),
        ...(body.fatalitiesInvolved !== undefined && { fatalitiesInvolved: body.fatalitiesInvolved }),
        ...(body.estimatedCost !== undefined && { estimatedCost: body.estimatedCost }),
        ...(body.status && { status: body.status })
      },
      include: {
        driver: {
          include: {
            user: true
          }
        },
        truck: true
      }
    });

    return NextResponse.json({ incident });
  } catch (error) {
    console.error('Error updating incident:', error);
    return NextResponse.json(
      { error: 'Failed to update incident' },
      { status: 500 }
    );
  }
}
