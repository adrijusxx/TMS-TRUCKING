import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { LoadStatus } from '@prisma/client';

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

    // Build base filter with MC number if applicable
    const baseFilter = await buildMcNumberWhereClause(session, request);

    // Build where clause from filters
    const where: any = {
      ...baseFilter,
      deletedAt: null,
    };

    // Apply filters
    const status = searchParams.get('status');
    if (status && status !== 'all') {
      // Handle IN_TRANSIT special case - map to multiple statuses
      if (status === 'IN_TRANSIT') {
        where.status = {
          in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'],
        };
      } else {
        where.status = status;
      }
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
    // For active loads, we want all active statuses regardless of any status filter
    const activeLoadsWhere = {
      ...baseFilter,
      deletedAt: null,
      status: {
        in: ['PENDING', 'ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY'] as LoadStatus[],
      },
    };
    
    const [totalLoads, totalRevenue, activeLoads] = await Promise.all([
      prisma.load.count({ where }),
      prisma.load.aggregate({
        where,
        _sum: {
          revenue: true,
        },
      }),
      prisma.load.count({
        where: activeLoadsWhere,
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

