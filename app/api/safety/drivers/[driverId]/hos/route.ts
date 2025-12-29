import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { driverId } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeViolations = searchParams.get('includeViolations') === 'true';

    // Verify the driver belongs to the user's company
    const driver = await prisma.driver.findFirst({
      where: {
        id: driverId,
        companyId: session.user.companyId
      }
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found or unauthorized' }, { status: 404 });
    }

    const where: any = {
      driverId
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const hosRecords = await prisma.hOSRecord.findMany({
      where,
      include: {
        driver: {
          include: {
            user: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 100
    });

    // If violations are requested, fetch them separately since violations is a JSON field, not a relation
    if (includeViolations) {
      // Violations are stored as JSON in the violations field
      // We'll include them in the response by parsing the JSON field
      const recordsWithViolations = hosRecords.map(record => ({
        ...record,
        violations: record.violations ? (typeof record.violations === 'string' ? JSON.parse(record.violations) : record.violations) : []
      }));
      return NextResponse.json({ hosRecords: recordsWithViolations });
    }

    return NextResponse.json({ hosRecords });
  } catch (error) {
    console.error('Error fetching HOS records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HOS records' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { driverId } = await params;
    const body = await request.json();

    // Verify the driver belongs to the user's company
    const driver = await prisma.driver.findFirst({
      where: {
        id: driverId,
        companyId: session.user.companyId
      }
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found or unauthorized' }, { status: 404 });
    }

    // Violations is a JSON field, not a relation, so store it as JSON
    const hosRecord = await prisma.hOSRecord.create({
      data: {
        driverId,
        date: new Date(body.date),
        driveTime: body.drivingHours || body.driveTime || 0,
        onDutyTime: body.onDutyHours || body.onDutyTime || 0,
        offDutyTime: body.offDutyHours || body.offDutyTime || 0,
        sleeperTime: body.sleeperBerthHours || body.sleeperTime || 0,
        status: body.status || 'ON_DUTY',
        violations: body.violations ? (JSON.stringify(body.violations) as any) : null
      },
      include: {
        driver: {
          include: {
            user: true
          }
        }
      }
    });

    return NextResponse.json({ hosRecord }, { status: 201 });
  } catch (error) {
    console.error('Error creating HOS record:', error);
    return NextResponse.json(
      { error: 'Failed to create HOS record' },
      { status: 500 }
    );
  }
}

