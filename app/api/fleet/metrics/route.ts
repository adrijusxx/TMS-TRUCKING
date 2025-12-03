import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause, buildMcNumberWhereClause } from '@/lib/mc-number-filter';

/**
 * GET /api/fleet/metrics
 * Get comprehensive fleet metrics for dashboard
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

    // Build MC filters - wrap in try-catch to make optional
    let truckFilter: any = { companyId: session.user.companyId };
    let driverFilter: any = { companyId: session.user.companyId };
    let loadFilter: any = { companyId: session.user.companyId };

    try {
      truckFilter = await buildMcNumberIdWhereClause(session, request);
      driverFilter = await buildMcNumberIdWhereClause(session, request);
      const loadMcWhere = await buildMcNumberWhereClause(session, request);
      loadFilter = loadMcWhere;
    } catch (mcError) {
      console.warn('MC number filter failed for fleet metrics, continuing without MC filter:', mcError);
    }

    // Get truck metrics
    const allTrucks = await prisma.truck.findMany({
      where: {
        ...truckFilter,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        currentDrivers: { select: { id: true } },
      },
    });

    const truckStats = {
      total: allTrucks.length,
      available: allTrucks.filter((t) => t.status === 'AVAILABLE').length,
      inUse: allTrucks.filter((t) => t.status === 'IN_USE').length,
      maintenance: allTrucks.filter((t) => t.status === 'MAINTENANCE').length,
      outOfService: allTrucks.filter((t) => t.status === 'OUT_OF_SERVICE').length,
      withDrivers: allTrucks.filter((t) => t.currentDrivers.length > 0).length,
      utilizationRate: allTrucks.length > 0
        ? (allTrucks.filter((t) => t.status === 'IN_USE').length / allTrucks.length) * 100
        : 0,
    };

    // Get driver metrics
    const allDrivers = await prisma.driver.findMany({
      where: {
        ...driverFilter,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
      },
    });

    const driverStats = {
      total: allDrivers.length,
      available: allDrivers.filter((d) => d.status === 'AVAILABLE').length,
      onDuty: allDrivers.filter((d) => d.status === 'AVAILABLE' || d.status === 'ON_DUTY').length,
      offDuty: allDrivers.filter((d) => d.status === 'OFF_DUTY').length,
    };

    // Get load metrics
    const activeLoads = await prisma.load.findMany({
      where: {
        ...loadFilter,
        status: {
          in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'],
        },
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        truckId: true,
      },
    });

    const loadStats = {
      active: activeLoads.length,
      assigned: activeLoads.filter((l) => l.truckId !== null).length,
    };

    // Get maintenance metrics
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const now = new Date();

    // MaintenanceRecord has companyId directly and no deletedAt field
    const maintenanceRecords = await prisma.maintenanceRecord.findMany({
      where: {
        companyId: session.user.companyId,
      },
      select: {
        id: true,
        nextServiceDate: true,
        cost: true,
      },
    });

    const maintenanceStats = {
      overdue: maintenanceRecords.filter((m) => m.nextServiceDate && m.nextServiceDate < now).length,
      dueSoon: maintenanceRecords.filter(
        (m) => m.nextServiceDate && m.nextServiceDate >= now && m.nextServiceDate <= thirtyDaysFromNow
      ).length,
      scheduled: maintenanceRecords.filter((m) => m.nextServiceDate && m.nextServiceDate > thirtyDaysFromNow).length,
      totalCost: maintenanceRecords.reduce((sum, m) => sum + (m.cost || 0), 0),
    };

    // Get breakdown metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Breakdown has companyId directly and deletedAt field
    const allBreakdowns = await prisma.breakdown.findMany({
      where: {
        companyId: session.user.companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        reportedAt: true,
        totalCost: true,
      },
    });

    const breakdownStats = {
      active: allBreakdowns.filter((b) => b.status === 'REPORTED' || b.status === 'IN_PROGRESS').length,
      recent: allBreakdowns.filter((b) => b.reportedAt && b.reportedAt >= thirtyDaysAgo).length,
      totalCost: allBreakdowns.reduce((sum, b) => sum + (b.totalCost || 0), 0),
    };

    // Get inspection metrics
    // Inspection has companyId directly and deletedAt field
    const inspections = await prisma.inspection.findMany({
      where: {
        companyId: session.user.companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        inspectionDate: true,
        nextInspectionDue: true,
      },
    });

    const inspectionStats = {
      due: inspections.filter((i) => i.nextInspectionDue && i.nextInspectionDue <= thirtyDaysFromNow && i.nextInspectionDue >= now).length,
      overdue: inspections.filter((i) => i.nextInspectionDue && i.nextInspectionDue < now).length,
      upcoming: inspections.filter((i) => i.nextInspectionDue && i.nextInspectionDue > thirtyDaysFromNow).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        trucks: truckStats,
        drivers: driverStats,
        loads: loadStats,
        maintenance: maintenanceStats,
        breakdowns: breakdownStats,
        inspections: inspectionStats,
      },
    });
  } catch (error: any) {
    console.error('Error fetching fleet metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch fleet metrics',
        },
      },
      { status: 500 }
    );
  }
}

