import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { vehicleId } = await params;

    const inspections = await prisma.roadsideInspection.findMany({
      where: {
        truckId: vehicleId,
        companyId: session.user.companyId
      },
      include: {
        driver: {
          include: {
            user: true
          }
        },
        truck: true,
        violations: {
          orderBy: { createdAt: 'desc' }
        },
        documents: true
      },
      orderBy: { inspectionDate: 'desc' }
    });

    return NextResponse.json({ inspections });
  } catch (error) {
    console.error('Error fetching roadside inspections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roadside inspections' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { vehicleId } = await params;
    const body = await request.json();

    const inspection = await prisma.roadsideInspection.create({
      data: {
        companyId: session.user.companyId,
        driverId: body.driverId,
        truckId: vehicleId,
        inspectionDate: new Date(body.inspectionDate),
        inspectionLocation: body.inspectionLocation,
        inspectionState: body.inspectionState,
        inspectionLevel: body.inspectionLevel,
        inspectorName: body.inspectorName,
        inspectorBadgeNumber: body.inspectorBadgeNumber,
        violationsFound: body.violationsFound || false,
        outOfService: body.outOfService || false,
        oosReason: body.oosReason,
        violations: {
          create: (body.violations || []).map((violation: any) => ({
            violationCode: violation.violationCode,
            violationDescription: violation.violationDescription,
            severityWeight: violation.severityWeight,
            basicCategory: violation.basicCategory
          }))
        }
      },
      include: {
        driver: {
          include: {
            user: true
          }
        },
        truck: true,
        violations: true,
        documents: true
      }
    });

    // If OOS, create OOS order
    if (inspection.outOfService) {
      await prisma.outOfServiceOrder.create({
        data: {
          companyId: session.user.companyId,
          driverId: body.driverId,
          truckId: vehicleId,
          oosDate: new Date(body.inspectionDate),
          oosReason: body.oosReason || 'Roadside inspection',
          oosType: body.driverId ? 'DRIVER' : 'VEHICLE',
          requiredCorrectiveAction: body.requiredCorrectiveAction,
          inspectorName: body.inspectorName,
          inspectorBadgeNumber: body.inspectorBadgeNumber,
          inspectionId: inspection.id,
          status: 'ACTIVE'
        }
      });
    }

    return NextResponse.json({ inspection }, { status: 201 });
  } catch (error) {
    console.error('Error creating roadside inspection:', error);
    return NextResponse.json(
      { error: 'Failed to create roadside inspection' },
      { status: 500 }
    );
  }
}

