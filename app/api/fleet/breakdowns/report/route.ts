import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/fleet/breakdowns/report
 * Get comprehensive breakdown report and analytics
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
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default to 90 days ago
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();
    const truckId = searchParams.get('truckId');

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
      reportedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (truckId) {
      where.truckId = truckId;
    }

    // Get all breakdowns
    const breakdowns = await prisma.breakdown.findMany({
      where,
      select: {
        id: true,
        truckId: true,
        truck: {
          select: {
            truckNumber: true,
          },
        },
        breakdownType: true,
        priority: true,
        status: true,
        reportedAt: true,
        dispatchedAt: true,
        repairCompletedAt: true,
        truckReadyAt: true,
        downtimeHours: true,
        totalCost: true,
        serviceProvider: true,
      },
      orderBy: {
        reportedAt: 'asc',
      },
    });

    // Calculate metrics
    const totalBreakdowns = breakdowns.length;
    const resolvedBreakdowns = breakdowns.filter(
      (b) => b.status === 'RESOLVED' || b.status === 'COMPLETED'
    ).length;

    // Calculate average response time (time from reported to dispatched)
    const breakdownsWithDispatch = breakdowns.filter((b) => b.dispatchedAt);
    const averageResponseTime =
      breakdownsWithDispatch.length > 0
        ? breakdownsWithDispatch.reduce((sum, b) => {
            const responseTime =
              (new Date(b.dispatchedAt!).getTime() - new Date(b.reportedAt).getTime()) /
              (1000 * 60 * 60);
            return sum + responseTime;
          }, 0) / breakdownsWithDispatch.length
        : 0;

    // Calculate average resolution time (time from reported to truck ready)
    const breakdownsWithResolution = breakdowns.filter((b) => b.truckReadyAt);
    const averageResolutionTime =
      breakdownsWithResolution.length > 0
        ? breakdownsWithResolution.reduce((sum, b) => {
            const resolutionTime =
              (new Date(b.truckReadyAt!).getTime() - new Date(b.reportedAt).getTime()) /
              (1000 * 60 * 60);
            return sum + resolutionTime;
          }, 0) / breakdownsWithResolution.length
        : 0;

    // Calculate average downtime
    const breakdownsWithDowntime = breakdowns.filter((b) => b.downtimeHours && b.downtimeHours > 0);
    const averageDowntime =
      breakdownsWithDowntime.length > 0
        ? breakdownsWithDowntime.reduce((sum, b) => sum + (b.downtimeHours || 0), 0) /
          breakdownsWithDowntime.length
        : 0;

    // Calculate total and average cost
    const totalCost = breakdowns.reduce((sum, b) => sum + (b.totalCost || 0), 0);
    const averageCost = totalBreakdowns > 0 ? totalCost / totalBreakdowns : 0;

    // Calculate MTBF (Mean Time Between Failures)
    // Group breakdowns by truck and calculate average time between failures
    const truckBreakdowns: Record<string, Date[]> = {};
    breakdowns.forEach((b) => {
      if (!truckBreakdowns[b.truckId]) {
        truckBreakdowns[b.truckId] = [];
      }
      truckBreakdowns[b.truckId].push(new Date(b.reportedAt));
    });

    let totalDaysBetweenFailures = 0;
    let failureIntervals = 0;

    Object.values(truckBreakdowns).forEach((dates) => {
      if (dates.length > 1) {
        dates.sort((a, b) => a.getTime() - b.getTime());
        for (let i = 1; i < dates.length; i++) {
          const daysBetween = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
          totalDaysBetweenFailures += daysBetween;
          failureIntervals++;
        }
      }
    });

    const mtbf = failureIntervals > 0 ? totalDaysBetweenFailures / failureIntervals : 0;

    // Group by type
    const byType: Record<string, number> = {};
    breakdowns.forEach((b) => {
      byType[b.breakdownType] = (byType[b.breakdownType] || 0) + 1;
    });

    // Group by priority
    const byPriority: Record<string, number> = {};
    breakdowns.forEach((b) => {
      byPriority[b.priority] = (byPriority[b.priority] || 0) + 1;
    });

    // Group by truck
    const byTruckMap: Record<
      string,
      {
        truckNumber: string;
        count: number;
        totalCost: number;
        totalDowntime: number;
        downtimeCount: number;
      }
    > = {};
    breakdowns.forEach((b) => {
      if (!byTruckMap[b.truckId]) {
        byTruckMap[b.truckId] = {
          truckNumber: b.truck.truckNumber,
          count: 0,
          totalCost: 0,
          totalDowntime: 0,
          downtimeCount: 0,
        };
      }
      byTruckMap[b.truckId].count++;
      byTruckMap[b.truckId].totalCost += b.totalCost || 0;
      if (b.downtimeHours) {
        byTruckMap[b.truckId].totalDowntime += b.downtimeHours;
        byTruckMap[b.truckId].downtimeCount++;
      }
    });
    const byTruck = Object.entries(byTruckMap)
      .map(([truckId, data]) => ({
        truckId,
        truckNumber: data.truckNumber,
        count: data.count,
        totalCost: data.totalCost,
        averageDowntime: data.downtimeCount > 0 ? data.totalDowntime / data.downtimeCount : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Group by month
    const byMonthMap: Record<
      string,
      { count: number; totalCost: number; totalDowntime: number; downtimeCount: number }
    > = {};
    breakdowns.forEach((b) => {
      const month = new Date(b.reportedAt).toISOString().slice(0, 7); // YYYY-MM
      if (!byMonthMap[month]) {
        byMonthMap[month] = { count: 0, totalCost: 0, totalDowntime: 0, downtimeCount: 0 };
      }
      byMonthMap[month].count++;
      byMonthMap[month].totalCost += b.totalCost || 0;
      if (b.downtimeHours) {
        byMonthMap[month].totalDowntime += b.downtimeHours;
        byMonthMap[month].downtimeCount++;
      }
    });
    const byMonth = Object.entries(byMonthMap)
      .map(([month, data]) => ({
        month,
        count: data.count,
        totalCost: data.totalCost,
        averageDowntime: data.downtimeCount > 0 ? data.totalDowntime / data.downtimeCount : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Vendor performance
    const vendorMap: Record<
      string,
      {
        count: number;
        totalResponseTime: number;
        responseCount: number;
        totalResolutionTime: number;
        resolutionCount: number;
        totalCost: number;
      }
    > = {};
    breakdowns.forEach((b) => {
      if (!b.serviceProvider) return;

      if (!vendorMap[b.serviceProvider]) {
        vendorMap[b.serviceProvider] = {
          count: 0,
          totalResponseTime: 0,
          responseCount: 0,
          totalResolutionTime: 0,
          resolutionCount: 0,
          totalCost: 0,
        };
      }

      vendorMap[b.serviceProvider].count++;
      vendorMap[b.serviceProvider].totalCost += b.totalCost || 0;

      if (b.dispatchedAt) {
        const responseTime =
          (new Date(b.dispatchedAt).getTime() - new Date(b.reportedAt).getTime()) / (1000 * 60 * 60);
        vendorMap[b.serviceProvider].totalResponseTime += responseTime;
        vendorMap[b.serviceProvider].responseCount++;
      }

      if (b.truckReadyAt) {
        const resolutionTime =
          (new Date(b.truckReadyAt).getTime() - new Date(b.reportedAt).getTime()) / (1000 * 60 * 60);
        vendorMap[b.serviceProvider].totalResolutionTime += resolutionTime;
        vendorMap[b.serviceProvider].resolutionCount++;
      }
    });

    const vendorPerformance = Object.entries(vendorMap)
      .map(([vendorName, data]) => ({
        vendorName,
        count: data.count,
        averageResponseTime:
          data.responseCount > 0 ? data.totalResponseTime / data.responseCount : 0,
        averageResolutionTime:
          data.resolutionCount > 0 ? data.totalResolutionTime / data.resolutionCount : 0,
        totalCost: data.totalCost,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      data: {
        totalBreakdowns,
        resolvedBreakdowns,
        averageResponseTime: Math.round(averageResponseTime * 10) / 10,
        averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
        averageDowntime: Math.round(averageDowntime * 10) / 10,
        totalCost: Math.round(totalCost * 100) / 100,
        averageCost: Math.round(averageCost * 100) / 100,
        mtbf: Math.round(mtbf * 10) / 10,
        byType,
        byPriority,
        byTruck,
        byMonth,
        vendorPerformance,
      },
    });
  } catch (error: any) {
    console.error('Error fetching breakdown report:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch breakdown report',
        },
      },
      { status: 500 }
    );
  }
}

