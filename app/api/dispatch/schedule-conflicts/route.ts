import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ScheduleConflictManager } from '@/lib/managers/ScheduleConflictManager';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const pickupTime = searchParams.get('pickupTime');
    const deliveryTime = searchParams.get('deliveryTime');

    if (!driverId || !pickupTime) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'driverId and pickupTime are required' } },
        { status: 400 }
      );
    }

    const pickupDate = new Date(pickupTime);
    if (isNaN(pickupDate.getTime())) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid pickupTime date' } },
        { status: 400 }
      );
    }

    const deliveryDate = deliveryTime ? new Date(deliveryTime) : undefined;
    if (deliveryDate && isNaN(deliveryDate.getTime())) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid deliveryTime date' } },
        { status: 400 }
      );
    }

    const result = await ScheduleConflictManager.detectConflicts(
      driverId,
      pickupDate,
      deliveryDate
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Schedule conflicts error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
