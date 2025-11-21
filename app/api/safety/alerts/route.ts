import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { AlertService } from '@/lib/services/safety/AlertService';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get('assignedTo');
    const status = searchParams.get('status') || 'ACTIVE';

    const alertService = new AlertService(prisma, companyId);

    const where: any = {
      companyId,
      status: status as any
    };

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    const alerts = await prisma.complianceAlert.findMany({
      where,
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 100
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
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
    const alertService = new AlertService(prisma, session.user.companyId);

    const alert = await alertService.createAlert({
      ...body,
      companyId: session.user.companyId
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}

