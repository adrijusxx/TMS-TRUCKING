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

    const dispatcherId = searchParams.get('dispatcherId');
    if (dispatcherId) {
      where.assignedDispatcherId = dispatcherId;
    }

    const customerId = searchParams.get('customerId');
    if (customerId) {
      where.customerId = customerId;
    }

    const driverId = searchParams.get('driverId');
    if (driverId) {
      where.driverId = driverId;
    }

    const pickupCity = searchParams.get('pickupCity');
    if (pickupCity) {
      where.pickupCity = { contains: pickupCity, mode: 'insensitive' };
    }

    const deliveryCity = searchParams.get('deliveryCity');
    if (deliveryCity) {
      where.deliveryCity = { contains: deliveryCity, mode: 'insensitive' };
    }

    const pickupDate = searchParams.get('pickupDate');
    if (pickupDate) {
      const date = new Date(pickupDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.pickupDate = {
        gte: date,
        lt: nextDay,
      };
    }

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) {
      where.OR = [
        {
          pickupDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          deliveryDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      ];
    }

    const minRevenue = searchParams.get('revenue');
    if (minRevenue) {
      where.revenue = { gte: parseFloat(minRevenue) };
    }

    // Search OR is set after date range OR, so it overwrites it if both are present
    // This matches the behavior in /api/loads/route.ts
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
    // But we still apply all other filters (dispatcher, customer, driver, etc.)
    const activeLoadsWhere: any = {
      ...baseFilter,
      deletedAt: null,
      status: {
        in: ['PENDING', 'ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY'] as LoadStatus[],
      },
    };
    
    // Apply all filters to active loads as well (except status which is already set)
    if (dispatcherId) {
      activeLoadsWhere.assignedDispatcherId = dispatcherId;
    }
    if (customerId) {
      activeLoadsWhere.customerId = customerId;
    }
    if (driverId) {
      activeLoadsWhere.driverId = driverId;
    }
    if (pickupCity) {
      activeLoadsWhere.pickupCity = { contains: pickupCity, mode: 'insensitive' };
    }
    if (deliveryCity) {
      activeLoadsWhere.deliveryCity = { contains: deliveryCity, mode: 'insensitive' };
    }
    if (pickupDate) {
      const date = new Date(pickupDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      activeLoadsWhere.pickupDate = {
        gte: date,
        lt: nextDay,
      };
    }
    if (startDate && endDate) {
      activeLoadsWhere.OR = [
        {
          pickupDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          deliveryDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      ];
    }
    if (minRevenue) {
      activeLoadsWhere.revenue = { gte: parseFloat(minRevenue) };
    }
    // Search OR overwrites date range OR (matches main where clause behavior)
    if (search) {
      activeLoadsWhere.OR = [
        { loadNumber: { contains: search, mode: 'insensitive' } },
        { pickupCity: { contains: search, mode: 'insensitive' } },
        { deliveryCity: { contains: search, mode: 'insensitive' } },
      ];
    }
    
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

