import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/fleet/equipment
 * Mark a truck or trailer as long-term out of service
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { equipmentId, equipmentType, longTermOutOfService, outOfServiceReason, expectedReturnDate } = body;

    if (!equipmentId || !equipmentType || !['TRUCK', 'TRAILER'].includes(equipmentType)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'equipmentId and equipmentType (TRUCK|TRAILER) are required' } },
        { status: 400 }
      );
    }

    const data: any = {
      longTermOutOfService: !!longTermOutOfService,
      outOfServiceReason: longTermOutOfService ? (outOfServiceReason || null) : null,
      outOfServiceSince: longTermOutOfService ? new Date() : null,
      expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
    };

    if (longTermOutOfService) {
      data.status = 'OUT_OF_SERVICE';
    }

    if (equipmentType === 'TRUCK') {
      const truck = await prisma.truck.findFirst({
        where: { id: equipmentId, companyId: session.user.companyId },
      });
      if (!truck) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Truck not found' } },
          { status: 404 }
        );
      }
      await prisma.truck.update({ where: { id: equipmentId }, data });
    } else {
      const trailer = await prisma.trailer.findFirst({
        where: { id: equipmentId, companyId: session.user.companyId },
      });
      if (!trailer) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Trailer not found' } },
          { status: 404 }
        );
      }
      await prisma.trailer.update({ where: { id: equipmentId }, data });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating equipment OOS status:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
