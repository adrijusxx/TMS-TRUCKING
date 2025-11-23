import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause, buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    lastMonthStart.setHours(0, 0, 0, 0);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    lastMonthEnd.setHours(23, 59, 59, 999);

    // Build filters with MC number if applicable
    // Load uses mcNumber (string), Driver and Truck use mcNumberId (relation)
    const loadFilter = await buildMcNumberWhereClause(session, request);
    const driverTruckFilter = await buildMcNumberIdWhereClause(session, request);

    // Revenue calculations
    const [
      todayRevenue,
      weekRevenue,
      monthRevenue,
      lastMonthRevenue,
      activeLoads,
      pendingLoads,
      completedLoads,
      cancelledLoads,
      inUseTrucks,
      availableTrucks,
      maintenanceTrucks,
      activeDrivers,
      availableDrivers,
      onLeaveDrivers,
    ] = await Promise.all([
      // Today's revenue - include ALL loads, use pickupDate or deliveryDate
      prisma.load.aggregate({
        where: {
          ...loadFilter,
          deletedAt: null,
          OR: [
            { pickupDate: { gte: todayStart, lte: todayEnd } },
            { deliveryDate: { gte: todayStart, lte: todayEnd } },
            { deliveredAt: { gte: todayStart, lte: todayEnd } },
          ],
        },
        _sum: { revenue: true },
      }),
      // This week's revenue - include ALL loads
      prisma.load.aggregate({
        where: {
          ...loadFilter,
          deletedAt: null,
          OR: [
            { pickupDate: { gte: weekStart } },
            { deliveryDate: { gte: weekStart } },
            { deliveredAt: { gte: weekStart } },
          ],
        },
        _sum: { revenue: true },
      }),
      // This month's revenue - include ALL loads
      prisma.load.aggregate({
        where: {
          ...loadFilter,
          deletedAt: null,
          OR: [
            { pickupDate: { gte: monthStart } },
            { deliveryDate: { gte: monthStart } },
            { deliveredAt: { gte: monthStart } },
          ],
        },
        _sum: { revenue: true },
      }),
      // Last month's revenue - include ALL loads
      prisma.load.aggregate({
        where: {
          ...loadFilter,
          deletedAt: null,
          OR: [
            { 
              pickupDate: { 
                gte: lastMonthStart,
                lte: lastMonthEnd,
              } 
            },
            { 
              deliveryDate: { 
                gte: lastMonthStart,
                lte: lastMonthEnd,
              } 
            },
            { 
              deliveredAt: { 
                gte: lastMonthStart,
                lte: lastMonthEnd,
              } 
            },
          ],
        },
        _sum: { revenue: true },
      }),
      // Active loads
      prisma.load.count({
        where: {
          ...loadFilter,
          status: {
            in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY'],
          },
          deletedAt: null,
        },
      }),
      // Pending loads
      prisma.load.count({
        where: {
          ...loadFilter,
          status: 'PENDING',
          deletedAt: null,
        },
      }),
      // Completed loads
      prisma.load.count({
        where: {
          ...loadFilter,
          status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
          deletedAt: null,
        },
      }),
      // Cancelled loads
      prisma.load.count({
        where: {
          ...loadFilter,
          status: 'CANCELLED',
          deletedAt: null,
        },
      }),
      // Trucks in use
      prisma.truck.count({
        where: {
          ...driverTruckFilter,
          status: 'IN_USE',
          isActive: true,
          deletedAt: null,
        },
      }),
      // Available trucks
      prisma.truck.count({
        where: {
          ...driverTruckFilter,
          status: 'AVAILABLE',
          isActive: true,
          deletedAt: null,
        },
      }),
      // Trucks in maintenance
      prisma.truck.count({
        where: {
          ...driverTruckFilter,
          status: 'MAINTENANCE',
          isActive: true,
          deletedAt: null,
        },
      }),
      // Active drivers
      prisma.driver.count({
        where: {
          ...driverTruckFilter,
          status: { in: ['ON_DUTY', 'DRIVING'] },
          isActive: true,
          deletedAt: null,
        },
      }),
      // Available drivers
      prisma.driver.count({
        where: {
          ...driverTruckFilter,
          status: 'AVAILABLE',
          isActive: true,
          deletedAt: null,
        },
      }),
      // Drivers on leave
      prisma.driver.count({
        where: {
          ...driverTruckFilter,
          status: 'ON_LEAVE',
          isActive: true,
          deletedAt: null,
        },
      }),
    ]);

    const todayRev = todayRevenue._sum.revenue || 0;
    const weekRev = weekRevenue._sum.revenue || 0;
    const monthRev = monthRevenue._sum.revenue || 0;
    const lastMonthRev = lastMonthRevenue._sum.revenue || 0;
    const percentChange = lastMonthRev > 0
      ? ((monthRev - lastMonthRev) / lastMonthRev) * 100
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        revenue: {
          today: todayRev,
          thisWeek: weekRev,
          thisMonth: monthRev,
          lastMonth: lastMonthRev,
          percentChange: parseFloat(percentChange.toFixed(2)),
        },
        loads: {
          active: activeLoads,
          pending: pendingLoads,
          completed: completedLoads,
          cancelled: cancelledLoads,
        },
        trucks: {
          inUse: inUseTrucks,
          available: availableTrucks,
          maintenance: maintenanceTrucks,
        },
        drivers: {
          active: activeDrivers,
          available: availableDrivers,
          onLeave: onLeaveDrivers,
        },
      },
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

