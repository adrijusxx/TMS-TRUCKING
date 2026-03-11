import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

const INSPECTION_INCLUDES = {
  driver: { include: { user: { select: { firstName: true, lastName: true } } } },
  truck: { select: { id: true, truckNumber: true } },
  trailer: { select: { id: true, trailerNumber: true } },
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const inspection = await prisma.roadsideInspection.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
      include: INSPECTION_INCLUDES,
    });

    if (!inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    return NextResponse.json({ data: inspection });
  } catch (error) {
    console.error('Error fetching inspection:', error);
    return NextResponse.json({ error: 'Failed to fetch inspection' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.roadsideInspection.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    const inspection = await prisma.roadsideInspection.update({
      where: { id },
      data: {
        ...(body.inspectionLevel && { inspectionLevel: body.inspectionLevel }),
        ...(body.inspectionDate && { inspectionDate: new Date(body.inspectionDate) }),
        ...(body.inspectionLocation !== undefined && { inspectionLocation: body.inspectionLocation }),
        ...(body.inspectionState !== undefined && { inspectionState: body.inspectionState }),
        ...(body.inspectorName !== undefined && { inspectorName: body.inspectorName || null }),
        ...(body.inspectorBadgeNumber !== undefined && { inspectorBadgeNumber: body.inspectorBadgeNumber || null }),
        ...(body.violationsFound !== undefined && { violationsFound: body.violationsFound }),
        ...(body.outOfService !== undefined && { outOfService: body.outOfService }),
        ...(body.oosReason !== undefined && { oosReason: body.oosReason || null }),
        ...(body.recordable !== undefined && { recordable: body.recordable }),
        ...(body.totalCharge !== undefined && { totalCharge: body.totalCharge ? parseFloat(body.totalCharge) : null }),
        ...(body.totalFee !== undefined && { totalFee: body.totalFee ? parseFloat(body.totalFee) : null }),
        ...(body.note !== undefined && { note: body.note || null }),
        ...(body.driverId !== undefined && { driverId: body.driverId || null }),
        ...(body.truckId !== undefined && { truckId: body.truckId || null }),
        ...(body.trailerId !== undefined && { trailerId: body.trailerId || null }),
      },
      include: INSPECTION_INCLUDES,
    });

    return NextResponse.json({ data: inspection });
  } catch (error) {
    console.error('Error updating inspection:', error);
    return NextResponse.json({ error: 'Failed to update inspection' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.roadsideInspection.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    await prisma.roadsideInspection.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting inspection:', error);
    return NextResponse.json({ error: 'Failed to delete inspection' }, { status: 500 });
  }
}
