import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const claim = await prisma.insuranceClaim.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
      include: {
        driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        truck: { select: { id: true, truckNumber: true } },
        trailer: { select: { id: true, trailerNumber: true } },
        incident: { select: { id: true, incidentNumber: true } },
        policy: { select: { id: true, policyNumber: true } },
        documents: true,
      },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }
    return NextResponse.json({ data: claim });
  } catch (error) {
    console.error('Error fetching insurance claim:', error);
    return NextResponse.json({ error: 'Failed to fetch insurance claim' }, { status: 500 });
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

    const existing = await prisma.insuranceClaim.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    const claim = await prisma.insuranceClaim.update({
      where: { id },
      data: {
        ...(body.claimType && { claimType: body.claimType }),
        ...(body.dateOfLoss && { dateOfLoss: new Date(body.dateOfLoss) }),
        ...(body.insuranceCompany && { insuranceCompany: body.insuranceCompany }),
        ...(body.adjusterName !== undefined && { adjusterName: body.adjusterName }),
        ...(body.adjusterPhone !== undefined && { adjusterPhone: body.adjusterPhone }),
        ...(body.adjusterEmail !== undefined && { adjusterEmail: body.adjusterEmail }),
        ...(body.driverId !== undefined && { driverId: body.driverId }),
        ...(body.truckId !== undefined && { truckId: body.truckId }),
        ...(body.trailerId !== undefined && { trailerId: body.trailerId }),
        ...(body.hasPoliceReport !== undefined && { hasPoliceReport: body.hasPoliceReport }),
        ...(body.hasTowing !== undefined && { hasTowing: body.hasTowing }),
        ...(body.recordable !== undefined && { recordable: body.recordable }),
        ...(body.coverageType !== undefined && { coverageType: body.coverageType }),
        ...(body.estimatedLoss !== undefined && { estimatedLoss: body.estimatedLoss }),
        ...(body.driverCompStatus !== undefined && { driverCompStatus: body.driverCompStatus }),
        ...(body.driverAmount !== undefined && { driverAmount: body.driverAmount }),
        ...(body.vendorCompStatus !== undefined && { vendorCompStatus: body.vendorCompStatus }),
        ...(body.vendorAmount !== undefined && { vendorAmount: body.vendorAmount }),
        ...(body.totalCharge !== undefined && { totalCharge: body.totalCharge }),
        ...(body.totalFee !== undefined && { totalFee: body.totalFee }),
        ...(body.status && { status: body.status }),
      },
    });

    return NextResponse.json({ data: claim });
  } catch (error) {
    console.error('Error updating insurance claim:', error);
    return NextResponse.json({ error: 'Failed to update insurance claim' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.insuranceClaim.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    await prisma.insuranceClaim.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting insurance claim:', error);
    return NextResponse.json({ error: 'Failed to delete insurance claim' }, { status: 500 });
  }
}
