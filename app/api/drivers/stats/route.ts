import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Get driver statistics
 */
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

    // Build where clause from filters
    const where: any = {
      companyId: session.user.companyId,
      isActive: true,
      deletedAt: null,
    };

    // Apply filters
    const status = searchParams.get('status');
    if (status && status !== 'all') {
      where.status = status;
    }

    const search = searchParams.get('search');
    if (search) {
      where.OR = [
        { driverNumber: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search, mode: 'insensitive' } } },
        { currentTruck: { truckNumber: { contains: search, mode: 'insensitive' } } },
        { currentTrailer: { trailerNumber: { contains: search, mode: 'insensitive' } } },
        { homeTerminal: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get stats
    const [totalDrivers, availableDrivers, onDutyDrivers, avgRating] = await Promise.all([
      prisma.driver.count({ where }),
      prisma.driver.count({
        where: {
          ...where,
          status: 'AVAILABLE',
        },
      }),
      prisma.driver.count({
        where: {
          ...where,
          status: 'ON_DUTY',
        },
      }),
      prisma.driver.aggregate({
        where,
        _avg: {
          rating: true,
        },
      }),
    ]);

    const averageRating = avgRating._avg.rating || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalDrivers,
        availableDrivers,
        onDutyDrivers,
        averageRating,
      },
    });
  } catch (error) {
    console.error('Driver stats fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

