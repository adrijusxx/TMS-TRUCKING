import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/mobile/messages/unread
 * Get unread message count for driver
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const driver = await prisma.driver.findFirst({
      where: { userId: session.user.id, isActive: true, deletedAt: null },
    });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_DRIVER', message: 'User is not a driver' } },
        { status: 403 }
      );
    }

    const count = await prisma.communication.count({
      where: {
        driverId: driver.id,
        channel: 'MOBILE_APP',
        type: 'MESSAGE',
        direction: 'OUTBOUND', // Messages sent TO the driver
        status: { in: ['SENT', 'DELIVERED'] }, // Not yet read
      },
    });

    return NextResponse.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Unread count error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
