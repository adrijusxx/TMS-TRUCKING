import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const incidentType = searchParams.get('incidentType');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {
      companyId: session.user.companyId
    };

    if (incidentType) {
      where.incidentType = incidentType;
    }

    if (severity) {
      where.severity = severity;
    }

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [incidents, total] = await Promise.all([
      prisma.safetyIncident.findMany({
        where,
        include: {
          driver: {
            include: {
              user: true
            }
          },
          truck: true,
          investigation: {
            select: {
              id: true,
              status: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      }),
      prisma.safetyIncident.count({ where })
    ]);

    return NextResponse.json({
      incidents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const incident = await prisma.safetyIncident.create({
      data: {
        companyId: session.user.companyId,
        incidentNumber: body.incidentNumber || `INC-${Date.now()}`,
        incidentType: body.incidentType,
        severity: body.severity,
        date: new Date(body.date),
        location: body.location,
        city: body.city,
        state: body.state,
        description: body.description,
        driverId: body.driverId,
        truckId: body.truckId,
        loadId: body.loadId,
        injuriesInvolved: body.injuriesInvolved || false,
        fatalitiesInvolved: body.fatalitiesInvolved || false,
        estimatedCost: body.estimatedCost,
        status: body.status || 'OPEN'
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

    return NextResponse.json({ incident }, { status: 201 });
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json(
      { error: 'Failed to create incident' },
      { status: 500 }
    );
  }
}
