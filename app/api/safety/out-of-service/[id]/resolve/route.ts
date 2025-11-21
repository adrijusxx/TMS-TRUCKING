import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Get OOS order
    const oosOrder = await prisma.outOfServiceOrder.findUnique({
      where: { id },
      select: {
        companyId: true,
        truckId: true,
        oosType: true
      }
    });

    if (!oosOrder || oosOrder.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'OOS order not found' }, { status: 404 });
    }

    // Resolve OOS order
    const resolved = await prisma.outOfServiceOrder.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
        resolutionNotes: body.resolutionNotes,
        verificationDocumentId: body.verificationDocumentId
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
    if (resolved.oosType === 'VEHICLE' && resolved.truckId) {
      await prisma.truck.update({
        where: { id: resolved.truckId },
        data: { status: 'AVAILABLE' }
      });
    }

    return NextResponse.json({ oosOrder: resolved });
  } catch (error) {
    console.error('Error resolving OOS order:', error);
    return NextResponse.json(
      { error: 'Failed to resolve OOS order' },
      { status: 500 }
    );
  }
}

