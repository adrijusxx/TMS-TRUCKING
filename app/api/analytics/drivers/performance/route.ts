import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause, buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { hasPermission } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/server-permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check analytics permission (use database-backed check)
    const role = (session.user as any)?.role || 'CUSTOMER';
    if (!(await hasPermissionAsync(role, 'analytics.view'))) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
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

    // Build MC filter - Driver uses mcNumberId
    const driverMcWhere = await buildMcNumberIdWhereClause(session, request);

    const where: any = {
      ...driverMcWhere,
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
            deletedAt: null,
            OR: [
              { pickupDate: { gte: startDate, lte: endDate } },
              { deliveryDate: { gte: startDate, lte: endDate } },
              { deliveredAt: { gte: startDate, lte: endDate } },
            ],
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
      // Include all loads, not just completed ones
      const allLoads = driver.loads;
      const completedLoads = allLoads.filter(
        (load) => load.status === 'DELIVERED' || load.status === 'INVOICED' || load.status === 'PAID'
      );
      const totalLoads = allLoads.length;
      const onTimeLoads = completedLoads.filter((load) => {
        if (!load.deliveredAt || !load.deliveryDate) return false;
        return new Date(load.deliveredAt) <= new Date(load.deliveryDate);
      });

      // Calculate revenue and pay from all loads
      // Use current driver payRate for calculations (reflects updated pay rates)
      const totalRevenue = allLoads.reduce((sum, load) => sum + (Number(load.revenue) || 0), 0);

      // Calculate driver pay: use load.driverPay if set, otherwise calculate from current driver payRate
      const totalDriverPay = allLoads.reduce((sum, load) => {
        if (load.driverPay && load.driverPay > 0) {
          // Load has manually set driver pay
          return sum + load.driverPay;
        } else {
          // Calculate from current driver pay rate
          const miles = load.totalMiles || load.loadedMiles || load.emptyMiles || 0;
          if (driver.payType === 'PER_MILE' && miles > 0) {
            return sum + (miles * driver.payRate);
          } else if (driver.payType === 'PER_LOAD') {
            return sum + driver.payRate;
          } else if (driver.payType === 'PERCENTAGE') {
            return sum + ((load.revenue || 0) * (driver.payRate / 100));
          } else if (driver.payType === 'HOURLY') {
            // Estimate hours (50 mph average)
            const estimatedHours = miles > 0 ? miles / 50 : 10;
            return sum + (estimatedHours * driver.payRate);
          } else if (driver.payType === 'WEEKLY') {
            // WEEKLY pay is calculated at settlement level, not per load
            // For analytics, estimate based on number of weeks in the period
            return sum; // Don't add per-load pay for weekly drivers
          }
          return sum;
        }
      }, 0);

      const totalMiles = allLoads.reduce((sum, load) => {
        // Use totalMiles if available, otherwise estimate
        return sum + (load.totalMiles || load.loadedMiles || load.emptyMiles || 0);
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
        driverName: driver.user ? `${driver.user.firstName} ${driver.user.lastName}` : 'Unknown',
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

