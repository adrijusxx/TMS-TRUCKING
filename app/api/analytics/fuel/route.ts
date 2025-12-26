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
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();
    const truckId = searchParams.get('truckId');

    // Build MC filter - Truck uses mcNumberId
    const truckMcWhere = await buildMcNumberIdWhereClause(session, request);

    const where: any = {
      truck: {
        ...truckMcWhere,
      },
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (truckId) {
      where.truckId = truckId;
    }

    const fuelEntries = await prisma.fuelEntry.findMany({
      where,
      include: {
        truck: {
          select: {
            id: true,
            truckNumber: true,
          },
        },
        driver: {
          select: {
            id: true,
            driverNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate totals
    const totalGallons = fuelEntries.reduce((sum, entry) => sum + entry.gallons, 0);
    const totalCost = fuelEntries.reduce((sum, entry) => sum + entry.totalCost, 0);
    const averageCostPerGallon = fuelEntries.length > 0 ? totalCost / totalGallons : 0;

    // Get loads for the period to calculate fuel efficiency - include ALL loads
    // Load uses mcNumberId
    const loadMcWhere = await buildMcNumberWhereClause(session, request);
    const loads = await prisma.load.findMany({
      where: {
        ...loadMcWhere,
        deletedAt: null,
        OR: [
          { pickupDate: { gte: startDate, lte: endDate } },
          { deliveryDate: { gte: startDate, lte: endDate } },
          { deliveredAt: { gte: startDate, lte: endDate } },
        ],
        ...(truckId ? { truckId } : {}),
      },
      select: {
        revenue: true,
        loadedMiles: true,
        emptyMiles: true,
        route: {
          select: {
            totalDistance: true,
          },
        },
        totalMiles: true,
      },
    });

    const totalMiles = loads.reduce((sum, load) => {
      // Prioritize totalMiles, then loadedMiles + emptyMiles, then route distance
      return sum + (load.totalMiles || (load.loadedMiles || 0) + (load.emptyMiles || 0) || load.route?.totalDistance || 0);
    }, 0);
    const milesPerGallon = totalGallons > 0 ? totalMiles / totalGallons : 0;
    const fuelCostPerMile = totalMiles > 0 ? totalCost / totalMiles : 0;

    // Group by truck
    const byTruck = fuelEntries.reduce((acc, entry) => {
      const truckId = entry.truckId;
      if (!acc[truckId]) {
        acc[truckId] = {
          truckId,
          truckNumber: entry.truck.truckNumber,
          gallons: 0,
          totalCost: 0,
          entries: 0,
        };
      }
      acc[truckId].gallons += entry.gallons;
      acc[truckId].totalCost += entry.totalCost;
      acc[truckId].entries += 1;
      return acc;
    }, {} as Record<string, any>);

    const truckBreakdown = Object.values(byTruck).map((truck: any) => ({
      ...truck,
      averageCostPerGallon: truck.gallons > 0 ? truck.totalCost / truck.gallons : 0,
    }));

    // Group by month for trend analysis
    const byMonth = fuelEntries.reduce((acc, entry) => {
      const month = entry.date.toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = {
          month,
          gallons: 0,
          totalCost: 0,
          entries: 0,
        };
      }
      acc[month].gallons += entry.gallons;
      acc[month].totalCost += entry.totalCost;
      acc[month].entries += 1;
      return acc;
    }, {} as Record<string, any>);

    const monthlyTrend = Object.values(byMonth)
      .map((month: any) => ({
        ...month,
        averageCostPerGallon: month.gallons > 0 ? month.totalCost / month.gallons : 0,
      }))
      .sort((a: any, b: any) => a.month.localeCompare(b.month));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalGallons: parseFloat(totalGallons.toFixed(2)),
          totalCost: parseFloat(totalCost.toFixed(2)),
          averageCostPerGallon: parseFloat(averageCostPerGallon.toFixed(3)),
          totalMiles: parseFloat(totalMiles.toFixed(0)),
          milesPerGallon: parseFloat(milesPerGallon.toFixed(2)),
          fuelCostPerMile: parseFloat(fuelCostPerMile.toFixed(3)),
          totalEntries: fuelEntries.length,
        },
        byTruck: truckBreakdown.map((t: any) => ({
          ...t,
          gallons: parseFloat(t.gallons.toFixed(2)),
          totalCost: parseFloat(t.totalCost.toFixed(2)),
          averageCostPerGallon: parseFloat(t.averageCostPerGallon.toFixed(3)),
        })),
        monthlyTrend: monthlyTrend.map((m: any) => ({
          ...m,
          gallons: parseFloat(m.gallons.toFixed(2)),
          totalCost: parseFloat(m.totalCost.toFixed(2)),
          averageCostPerGallon: parseFloat(m.averageCostPerGallon.toFixed(3)),
        })),
      },
      meta: {
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      },
    });
  } catch (error) {
    console.error('Fuel analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

