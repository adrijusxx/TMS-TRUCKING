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
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      truckId: vehicleId,
      companyId: session.user.companyId
    };

    if (type) {
      where.inspectionType = type;
    }

    const dvirs = await prisma.dVIR.findMany({
      where,
      include: {
        driver: {
          include: {
            user: true
          }
        },
        truck: true,
        defects: {
          orderBy: { severity: 'desc' }
        },
        documents: true
      },
      orderBy: { inspectionDate: 'desc' },
      take: limit
    });

    return NextResponse.json({ dvirs });
  } catch (error) {
    console.error('Error fetching DVIRs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DVIRs' },
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

    // Create DVIR
    const dvir = await prisma.dVIR.create({
      data: {
        companyId: session.user.companyId,
        driverId: body.driverId,
        truckId: vehicleId,
        inspectionType: body.inspectionType,
        inspectionDate: new Date(body.inspectionDate),
        location: body.location,
        latitude: body.latitude,
        longitude: body.longitude,
        brakesOk: body.brakesOk ?? true,
        tiresOk: body.tiresOk ?? true,
        lightsOk: body.lightsOk ?? true,
        couplingOk: body.couplingOk ?? true,
        steeringOk: body.steeringOk ?? true,
        suspensionOk: body.suspensionOk ?? true,
        frameOk: body.frameOk ?? true,
        cargoSecurementOk: body.cargoSecurementOk ?? true,
        emergencyEquipmentOk: body.emergencyEquipmentOk ?? true,
        driverSignedAt: body.driverSignedAt ? new Date(body.driverSignedAt) : null,
        driverSignature: body.driverSignature,
        status: body.status || 'COMPLETED',
        vehicleNeedsRepair: body.vehicleNeedsRepair || false,
        defects: {
          create: (body.defects || []).map((defect: any) => ({
            inspectionPoint: defect.inspectionPoint,
            description: defect.description,
            severity: defect.severity,
            location: defect.location,
            photoDocumentIds: defect.photoDocumentIds || []
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
        defects: true,
        documents: true
      }
    });

    // If defects found, create work orders
    if (dvir.defects.length > 0 && dvir.vehicleNeedsRepair) {
      // Note: Work order creation would go here
      // This would integrate with the existing work order system
    }

    return NextResponse.json({ dvir }, { status: 201 });
  } catch (error) {
    console.error('Error creating DVIR:', error);
    return NextResponse.json(
      { error: 'Failed to create DVIR' },
      { status: 500 }
    );
  }
}

