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
    const inspectionType = searchParams.get('inspectionType');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      truckId: vehicleId,
      companyId: session.user.companyId
    };

    if (inspectionType) {
      where.inspectionType = inspectionType;
    }

    const inspections = await prisma.inspection.findMany({
      where,
      include: {
        truck: true,
      },
      orderBy: { inspectionDate: 'desc' },
      take: limit
    });

    return NextResponse.json({ inspections });
  } catch (error) {
    console.error('Error fetching vehicle inspections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle inspections' },
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

    // Calculate next inspection due date (annual from inspection date)
    const inspectionDate = new Date(body.inspectionDate);
    const nextInspectionDue = new Date(inspectionDate);
    nextInspectionDue.setFullYear(nextInspectionDue.getFullYear() + 1);

    // Generate inspection number
    const inspectionCount = await prisma.inspection.count({
      where: { companyId: session.user.companyId }
    });
    const inspectionNumber = `INS-${new Date().getFullYear()}-${String(inspectionCount + 1).padStart(6, '0')}`;

    const defectsCount = body.defects?.length || 0;
    const defectDetails = body.defects?.map((d: any) => d.description).join('; ') || null;

    const inspection = await prisma.inspection.create({
      data: {
        companyId: session.user.companyId,
        truckId: vehicleId,
        inspectionNumber,
        inspectionType: body.inspectionType,
        inspectionDate,
        nextInspectionDue,
        performedBy: body.inspectorId || session.user.id,
        location: body.inspectionLocation || null,
        status: body.passed ? 'PASSED' : 'FAILED',
        defects: defectsCount,
        defectDetails,
        notes: body.notes || null,
      },
      include: {
        truck: true,
      }
    });

    // If defects found, create defect records
    if (defectsCount > 0 && body.defects && body.defects.length > 0) {
      await Promise.all(
        body.defects.map((defect: any) =>
          prisma.defect.create({
            data: {
              companyId: session.user.companyId,
              truckId: vehicleId,
              sourceType: 'COMPANY_INSPECTION',
              sourceId: inspection.id,
              description: defect.description,
              severity: defect.severity || 'NON_CRITICAL',
              location: defect.location || null,
              reportedDate: inspectionDate,
            }
          })
        )
      );
    }

    return NextResponse.json({ inspection }, { status: 201 });
  } catch (error) {
    console.error('Error creating vehicle inspection:', error);
    return NextResponse.json(
      { error: 'Failed to create vehicle inspection' },
      { status: 500 }
    );
  }
}

