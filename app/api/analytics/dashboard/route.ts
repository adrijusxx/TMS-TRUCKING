import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

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
      // Today's revenue
      prisma.load.aggregate({
        where: {
          companyId: session.user.companyId,
          status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
          deliveredAt: {
            gte: todayStart,
            lte: todayEnd,
          },
          deletedAt: null,
        },
        _sum: { revenue: true },
      }),
      // This week's revenue
      prisma.load.aggregate({
        where: {
          companyId: session.user.companyId,
          status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
          deliveredAt: { gte: weekStart },
          deletedAt: null,
        },
        _sum: { revenue: true },
      }),
      // This month's revenue
      prisma.load.aggregate({
        where: {
          companyId: session.user.companyId,
          status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
          deliveredAt: { gte: monthStart },
          deletedAt: null,
        },
        _sum: { revenue: true },
      }),
      // Last month's revenue
      prisma.load.aggregate({
        where: {
          companyId: session.user.companyId,
          status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
          deliveredAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
          deletedAt: null,
        },
        _sum: { revenue: true },
      }),
      // Active loads
      prisma.load.count({
        where: {
          companyId: session.user.companyId,
          status: {
            in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY'],
          },
          deletedAt: null,
        },
      }),
      // Pending loads
      prisma.load.count({
        where: {
          companyId: session.user.companyId,
          status: 'PENDING',
          deletedAt: null,
        },
      }),
      // Completed loads
      prisma.load.count({
        where: {
          companyId: session.user.companyId,
          status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
          deletedAt: null,
        },
      }),
      // Cancelled loads
      prisma.load.count({
        where: {
          companyId: session.user.companyId,
          status: 'CANCELLED',
          deletedAt: null,
        },
      }),
      // Trucks in use
      prisma.truck.count({
        where: {
          companyId: session.user.companyId,
          status: 'IN_USE',
          isActive: true,
          deletedAt: null,
        },
      }),
      // Available trucks
      prisma.truck.count({
        where: {
          companyId: session.user.companyId,
          status: 'AVAILABLE',
          isActive: true,
          deletedAt: null,
        },
      }),
      // Trucks in maintenance
      prisma.truck.count({
        where: {
          companyId: session.user.companyId,
          status: 'MAINTENANCE',
          isActive: true,
          deletedAt: null,
        },
      }),
      // Active drivers
      prisma.driver.count({
        where: {
          companyId: session.user.companyId,
          status: { in: ['ON_DUTY', 'DRIVING'] },
          isActive: true,
          deletedAt: null,
        },
      }),
      // Available drivers
      prisma.driver.count({
        where: {
          companyId: session.user.companyId,
          status: 'AVAILABLE',
          isActive: true,
          deletedAt: null,
        },
      }),
      // Drivers on leave
      prisma.driver.count({
        where: {
          companyId: session.user.companyId,
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

