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
    const status = searchParams.get('status') || 'ACTIVE';

    const oosOrders = await prisma.outOfServiceOrder.findMany({
      where: {
        truckId: vehicleId,
        companyId: session.user.companyId,
        status: status as any
      },
      include: {
        truck: true,
        driver: {
          include: {
            user: true
          }
        }
      },
      orderBy: { oosDate: 'desc' }
    });

    return NextResponse.json({ oosOrders });
  } catch (error) {
    console.error('Error fetching OOS orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch OOS orders' },
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

    const oosOrder = await prisma.outOfServiceOrder.create({
      data: {
        companyId: session.user.companyId,
        driverId: body.driverId,
        truckId: vehicleId,
        oosDate: new Date(body.oosDate),
        oosReason: body.oosReason,
        oosType: body.oosType || 'VEHICLE',
        requiredCorrectiveAction: body.requiredCorrectiveAction,
        inspectorName: body.inspectorName,
        inspectorBadgeNumber: body.inspectorBadgeNumber,
        inspectionId: body.inspectionId,
        status: 'ACTIVE'
      },
      include: {
        truck: true,
        driver: {
          include: {
            user: true
          }
        }
      }
    });

    // Update truck status if vehicle OOS
    if (oosOrder.oosType === 'VEHICLE') {
      await prisma.truck.update({
        where: { id: vehicleId },
        data: { status: 'OUT_OF_SERVICE' }
      });
    }

    return NextResponse.json({ oosOrder }, { status: 201 });
  } catch (error) {
    console.error('Error creating OOS order:', error);
    return NextResponse.json(
      { error: 'Failed to create OOS order' },
      { status: 500 }
    );
  }
}

