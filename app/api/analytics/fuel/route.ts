import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause, buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { hasPermissionAsync } from '@/lib/server-permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any)?.role || 'CUSTOMER';
    if (!(await hasPermissionAsync(role, 'analytics.view'))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const loadMcWhere = await buildMcNumberWhereClause(session, request);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Fetch loads to aggregate fuel expenses from
    // In a real scenario, Fuel might be a separate table or linked to Expenses
    // Assuming 'totalExpenses' on Load includes fuel, or we look at an 'Expense' table.
    // For this implementation, we will query the 'Expense' table if it exists, otherwise fall back to Load estimates.
    // Let's check for an Expense table linked to Loads or standalone.
    // Based on previous context, we have an Expense model.

    // Query FuelEntry table
    const expenses = await prisma.fuelEntry.findMany({
      where: {
        date: dateFilter,
        truck: {
          companyId: session.user.companyId
        },
        // Fix: Exclude companyId from loadMcWhere as FuelEntry doesn't have it directly
        ...(loadMcWhere.mcNumberId ? { mcNumberId: loadMcWhere.mcNumberId } : {})
      },
      include: {
        truck: true
      }
    });

    const loads = await prisma.load.findMany({
      where: {
        ...loadMcWhere,
        deletedAt: null,
        pickupDate: dateFilter,
        status: { in: ['DELIVERED', 'BILLING_HOLD', 'READY_TO_BILL', 'INVOICED', 'PAID'] }
      },
      select: {
        id: true,
        totalMiles: true,
        truckId: true,
      }
    });


    // Aggregation
    let totalCost = 0;
    let totalGallons = 0; // If we don't have this, we estimate cost / avg_price
    const AVG_FUEL_PRICE = 4.50; // Fallback

    // Group by Truck
    const truckMap = new Map<string, {
      truckNumber: string;
      gallons: number;
      totalCost: number;
      entries: number;
    }>();

    for (const exp of expenses) {
      const cost = Number(exp.totalCost || 0);
      const gals = Number(exp.gallons || 0);

      totalCost += cost;
      totalGallons += gals;

      if (exp.truck) {
        if (!truckMap.has(exp.truck.id)) {
          truckMap.set(exp.truck.id, {
            truckNumber: exp.truck.truckNumber,
            gallons: 0,
            totalCost: 0,
            entries: 0
          });
        }
        const t = truckMap.get(exp.truck.id)!;
        t.totalCost += cost;
        t.gallons += gals;
        t.entries++;
      }
    }

    const totalMiles = loads.reduce((sum, l) => sum + Number(l.totalMiles || 0), 0);
    const milesPerGallon = totalGallons > 0 ? totalMiles / totalGallons : 0;
    const fuelCostPerMile = totalMiles > 0 ? totalCost / totalMiles : 0;
    const averageCostPerGallon = totalGallons > 0 ? totalCost / totalGallons : 0;

    // Monthly Trend (Dummy based on start/end range split)
    // For real trend we'd group by month.
    // Let's do a simple 12-month grouping if range allows, or daily.
    const monthlyTrend: { month: string; cost: number; gallons: number }[] = []; // Populate if needed

    const byTruck = Array.from(truckMap.values()).map(t => ({
      ...t,
      averageCostPerGallon: t.gallons > 0 ? t.totalCost / t.gallons : 0
    })).sort((a, b) => b.totalCost - a.totalCost);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalCost,
          totalGallons,
          milesPerGallon,
          fuelCostPerMile,
          averageCostPerGallon
        },
        byTruck,
        monthlyTrend
      }
    });

  } catch (error: any) {
    console.error('Fuel analytics error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
