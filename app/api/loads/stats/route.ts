import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Get load statistics
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
        { loadNumber: { contains: search, mode: 'insensitive' } },
        { pickupCity: { contains: search, mode: 'insensitive' } },
        { deliveryCity: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get stats
    const [totalLoads, totalRevenue, activeLoads] = await Promise.all([
      prisma.load.count({ where }),
      prisma.load.aggregate({
        where,
        _sum: {
          revenue: true,
        },
      }),
      prisma.load.count({
        where: {
          ...where,
          status: {
            in: ['PENDING', 'ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY'],
          },
        },
      }),
    ]);

    const revenue = totalRevenue._sum.revenue || 0;
    const averageRevenue = totalLoads > 0 ? revenue / totalLoads : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalLoads,
        totalRevenue: revenue,
        activeLoads,
        averageRevenue,
      },
    });
  } catch (error) {
    console.error('Load stats fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

