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

    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    if (driverId) {
      where.id = driverId;
    }

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        loads: {
          where: {
            deliveredAt: {
              gte: startDate,
              lte: endDate,
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
        },
        hosRecords: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    });

    const performanceData = drivers.map((driver) => {
      const completedLoads = driver.loads.filter(
        (load) => load.status === 'DELIVERED' || load.status === 'INVOICED' || load.status === 'PAID'
      );
      const totalLoads = driver.loads.length;
      const onTimeLoads = completedLoads.filter((load) => {
        if (!load.deliveredAt || !load.deliveryDate) return false;
        return new Date(load.deliveredAt) <= new Date(load.deliveryDate);
      });

      const totalRevenue = completedLoads.reduce((sum, load) => sum + load.revenue, 0);
      const totalDriverPay = completedLoads.reduce((sum, load) => sum + (load.driverPay || 0), 0);
      const totalMiles = completedLoads.reduce((sum, load) => {
        // Simplified - would use actual route distance from route table or calculate from locations
        // For now, use a default estimate of 500 miles per load
        return sum + 500;
      }, 0);

      // Calculate HOS compliance
      const hosRecords = driver.hosRecords;
      const totalHOSViolations = hosRecords.filter((r) => {
        const violations = r.violations as any;
        return violations && Array.isArray(violations) && violations.length > 0;
      }).length;

      // Calculate metrics
      const completionRate = totalLoads > 0 ? (completedLoads.length / totalLoads) * 100 : 0;
      const onTimeRate = completedLoads.length > 0 ? (onTimeLoads.length / completedLoads.length) * 100 : 0;
      const revenuePerMile = totalMiles > 0 ? totalRevenue / totalMiles : 0;
      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalDriverPay) / totalRevenue) * 100 : 0;
      const hosComplianceRate = hosRecords.length > 0
        ? ((hosRecords.length - totalHOSViolations) / hosRecords.length) * 100
        : 100;

      // Calculate performance score (0-100)
      const performanceScore =
        (completionRate * 0.25) +
        (onTimeRate * 0.25) +
        (profitMargin * 0.2) +
        (hosComplianceRate * 0.2) +
        (driver.rating ? driver.rating * 20 : 0);

      return {
        driverId: driver.id,
        driverName: `${driver.user.firstName} ${driver.user.lastName}`,
        driverNumber: driver.driverNumber,
        status: driver.status,
        metrics: {
          totalLoads,
          completedLoads: completedLoads.length,
          onTimeLoads: onTimeLoads.length,
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          totalDriverPay: parseFloat(totalDriverPay.toFixed(2)),
          totalMiles: parseFloat(totalMiles.toFixed(0)),
          totalHOSViolations,
        },
        rates: {
          completionRate: parseFloat(completionRate.toFixed(1)),
          onTimeRate: parseFloat(onTimeRate.toFixed(1)),
          revenuePerMile: parseFloat(revenuePerMile.toFixed(2)),
          profitMargin: parseFloat(profitMargin.toFixed(1)),
          hosComplianceRate: parseFloat(hosComplianceRate.toFixed(1)),
        },
        performanceScore: parseFloat(performanceScore.toFixed(1)),
        rating: driver.rating || 0,
      };
    });

    // Sort by performance score
    performanceData.sort((a, b) => b.performanceScore - a.performanceScore);

    return NextResponse.json({
      success: true,
      data: performanceData,
      meta: {
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
        totalDrivers: performanceData.length,
      },
    });
  } catch (error) {
    console.error('Driver performance error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

