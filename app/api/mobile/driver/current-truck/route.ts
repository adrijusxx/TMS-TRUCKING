import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/mobile/driver/current-truck
 * Get the authenticated driver's current truck information
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
      where: {
        userId: session.user.id,
        isActive: true,
        deletedAt: null,
      },
      include: {
        currentTruck: {
          select: {
            id: true,
            truckNumber: true,
            make: true,
            model: true,
            year: true,
          },
        },
      },
    });

    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_DRIVER', message: 'User is not a driver' },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        truck: driver.currentTruck,
      },
    });
  } catch (error) {
    console.error('Error fetching driver current truck:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch current truck',
        },
      },
      { status: 500 }
    );
  }
}

