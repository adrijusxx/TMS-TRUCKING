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

    const where: any = {
      driverId,
      companyId: session.user.companyId
    };

    if (startDate && endDate) {
      where.violationDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const violations = await prisma.hOSViolation.findMany({
      where,
      include: {
        driver: {
          include: {
            user: true
          }
        }
      },
      orderBy: { violationDate: 'desc' }
    });

    return NextResponse.json({ violations });
  } catch (error) {
    console.error('Error fetching HOS violations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HOS violations' },
      { status: 500 }
    );
  }
}

