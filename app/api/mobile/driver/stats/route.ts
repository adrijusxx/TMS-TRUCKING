import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek } from 'date-fns';

/**
 * GET /api/mobile/driver/stats
 * Get driver dashboard stats (weekly miles, estimated pay, safety score)
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
    });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_DRIVER', message: 'User is not a driver' } },
        { status: 403 }
      );
    }

    // Get week range (Sunday to Saturday)
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });

    // Get loads for the week
    const weeklyLoads = await prisma.load.findMany({
      where: {
        driverId: driver.id,
        OR: [
          { pickupDate: { gte: weekStart, lte: weekEnd } },
          { deliveryDate: { gte: weekStart, lte: weekEnd } },
          { deliveredAt: { gte: weekStart, lte: weekEnd } },
        ],
        deletedAt: null,
      },
      select: {
        totalMiles: true,
        loadedMiles: true,
        emptyMiles: true,
        driverPay: true,
        revenue: true,
        status: true,
      },
    });

    // Calculate weekly miles
    const weeklyMiles = weeklyLoads.reduce((sum, load) => {
      return sum + (load.totalMiles || load.loadedMiles || load.emptyMiles || 0);
    }, 0);

    // Calculate estimated pay
    let estimatedPay = 0;
    for (const load of weeklyLoads) {
      if (load.driverPay && load.driverPay > 0) {
        estimatedPay += load.driverPay;
      } else {
        const miles = load.totalMiles || load.loadedMiles || load.emptyMiles || 0;
        if (driver.payType === 'PER_MILE' && miles > 0) {
          estimatedPay += miles * driver.payRate;
        } else if (driver.payType === 'PER_LOAD') {
          estimatedPay += driver.payRate;
        } else if (driver.payType === 'PERCENTAGE') {
          estimatedPay += (load.revenue || 0) * (driver.payRate / 100);
        } else if (driver.payType === 'HOURLY') {
          const estimatedHours = miles > 0 ? miles / 50 : 10;
          estimatedPay += estimatedHours * driver.payRate;
        }
      }
    }

    // Get safety score (rating or calculate from incidents)
    const safetyScore = driver.rating || 100; // Default to 100 if no rating

    // Get active breakdowns
    const activeBreakdowns = await prisma.breakdown.count({
      where: {
        driverId: driver.id,
        status: {
          in: ['REPORTED', 'DISPATCHED', 'IN_PROGRESS'],
        },
      },
    });

    // Get active loads
    const activeLoads = await prisma.load.findMany({
      where: {
        driverId: driver.id,
        status: {
          in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'],
        },
        deletedAt: null,
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        pickupDate: 'asc',
      },
      take: 1, // Get the most recent active load
    });

    return NextResponse.json({
      success: true,
      data: {
        weeklyMiles: Math.round(weeklyMiles),
        estimatedPay,
        safetyScore: Math.round(safetyScore),
        activeBreakdowns,
        currentLoad: activeLoads[0] || null,
      },
    });
  } catch (error) {
    console.error('Error fetching driver stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch driver stats',
        },
      },
      { status: 500 }
    );
  }
}




























