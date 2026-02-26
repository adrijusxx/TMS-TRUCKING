import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

const OOS_INCLUDES = {
  driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
  truck: { select: { id: true, truckNumber: true } },
};

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
    const status = searchParams.get('status');
    const oosType = searchParams.get('oosType');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    if (status) where.status = status;
    if (oosType) where.oosType = oosType;
    if (search) {
      where.OR = [
        { oosReason: { contains: search, mode: 'insensitive' } },
        { resolutionNotes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, totalCount] = await Promise.all([
      prisma.outOfServiceOrder.findMany({
        where,
        include: OOS_INCLUDES,
        orderBy: { oosDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.outOfServiceOrder.count({ where }),
    ]);

    return NextResponse.json({
      data: orders,
      meta: { totalCount, totalPages: Math.ceil(totalCount / limit), page, pageSize: limit },
    });
  } catch (error) {
    console.error('Error fetching OOS orders:', error);
    return NextResponse.json({ error: 'Failed to fetch OOS orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const order = await prisma.outOfServiceOrder.create({
      data: {
        companyId: session.user.companyId,
        oosDate: new Date(body.oosDate),
        oosReason: body.oosReason,
        oosType: body.oosType,
        driverId: body.driverId ?? undefined,
        truckId: body.truckId ?? undefined,
        requiredCorrectiveAction: body.requiredCorrectiveAction ?? undefined,
        inspectorName: body.inspectorName ?? undefined,
        inspectorBadgeNumber: body.inspectorBadgeNumber ?? undefined,
        inspectionId: body.inspectionId ?? undefined,
      },
      include: OOS_INCLUDES,
    });

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error) {
    console.error('Error creating OOS order:', error);
    return NextResponse.json({ error: 'Failed to create OOS order' }, { status: 500 });
  }
}
