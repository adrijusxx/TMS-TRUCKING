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
    const status = searchParams.get('status') || 'OPEN';
    const severity = searchParams.get('severity');
    const truckId = searchParams.get('truckId');

    const where: any = {
      companyId: session.user.companyId,
      status: status as any
    };

    if (severity) {
      where.severity = severity;
    }

    if (truckId) {
      where.truckId = truckId;
    }

    const defects = await prisma.defect.findMany({
      where,
      include: {
        truck: true
      },
      orderBy: [
        { severity: 'desc' },
        { reportedDate: 'desc' }
      ]
    });

    return NextResponse.json({ defects });
  } catch (error) {
    console.error('Error fetching defects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch defects' },
      { status: 500 }
    );
  }
}

