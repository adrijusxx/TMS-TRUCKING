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
    const groupBy = searchParams.get('groupBy') || 'customer'; // customer, lane

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const loads = await prisma.load.findMany({
      where: {
        ...loadMcWhere,
        deletedAt: null,
        pickupDate: dateFilter,
        status: { in: ['DELIVERED', 'BILLING_HOLD', 'READY_TO_BILL', 'INVOICED', 'PAID'] }
      },
      select: {
        id: true,
        revenue: true,
        driverPay: true,
        totalExpenses: true, // Should include fuel, maintenance, etc. allocated to load
        profit: true,
        totalMiles: true,
        customer: { select: { id: true, name: true } },
        pickupState: true,
        deliveryState: true,
      }
    });

    const groupMap = new Map<string, any>();

    for (const load of loads) {
      let key = '';
      let name = '';

      if (groupBy === 'customer') {
        key = load.customer?.id || 'Unknown';
        name = load.customer?.name || 'Unknown Customer';
      } else if (groupBy === 'lane') {
        key = `${load.pickupState || '?'} -> ${load.deliveryState || '?'}`;
        name = key;
      }

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          id: key,
          name: name,
          revenue: 0,
          cost: 0,
          profit: 0,
          loads: 0,
          miles: 0
        });
      }

      const item = groupMap.get(key);
      const rev = Number(load.revenue || 0);
      const pay = Number(load.driverPay || 0);
      const exp = Number(load.totalExpenses || 0);
      const prof = Number(load.profit || 0);

      // Recalculate profit if needed or trust DB
      // const calcProfit = rev - pay - exp;

      item.revenue += rev;
      item.cost += (pay + exp);
      item.profit += prof;
      item.loads++;
      item.miles += Number(load.totalMiles || 0);
    }

    // --- Fixed Costs Calculation ---
    // Fetch active asset counts to estimate fixed costs
    const [trucks, trailers] = await Promise.all([
      prisma.truck.findMany({
        where: {
          companyId: session.user.companyId,
          status: { in: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'MAINTENANCE_DUE', 'NEEDS_REPAIR', 'OUT_OF_SERVICE'] },
          deletedAt: null
        },
        select: { year: true }
      }),
      prisma.trailer.count({
        where: {
          companyId: session.user.companyId,
          isActive: true, // Use isActive flag for trailers
          deletedAt: null
        }
      })
    ]);

    // 1. Truck Payments (Dynamic based on year)
    let monthlyTruckPayments = 0;
    trucks.forEach(t => {
      // Estimates: 2025+ ($3.2k), 2022+ ($2.2k), 2019+ ($1.4k), Older ($800 maint/pay)
      if (t.year >= 2025) monthlyTruckPayments += 3200;
      else if (t.year >= 2022) monthlyTruckPayments += 2200;
      else if (t.year >= 2019) monthlyTruckPayments += 1400;
      else monthlyTruckPayments += 800;
    });

    // 2. Trailer Payments & Other Fixed Costs
    const monthlyTrailerPayments = trailers * 800; // Est $800/mo
    const fleetSize = trucks.length || 1;

    // 3. Staff Salaries (Lean Estimates)
    // Dispatch (1:7 trucks), Safety (1:50), Accounting (1:40), FleetMgr (1:50)
    const estDispatchers = Math.ceil(fleetSize / 7);
    const estSafety = Math.ceil(fleetSize / 50);
    const estAccounting = Math.ceil(fleetSize / 40);
    const estFleetMgr = Math.ceil(fleetSize / 50);

    const monthlySalaries =
      (estDispatchers * 5000) +
      (estSafety * 4500) +
      (estAccounting * 4000) +
      (estFleetMgr * 5500);

    const monthlyInsurance = fleetSize * 1200; // ~$1200/truck
    const monthlySoftware = fleetSize * 150;   // TMS, ELD, etc.

    const totalMonthlyFixedCosts =
      monthlyTruckPayments +
      monthlyTrailerPayments +
      monthlySalaries +
      monthlyInsurance +
      monthlySoftware;

    // Calculate Daily Fixed Cost and scale to the analysis period
    const dailyFixedCost = totalMonthlyFixedCosts / 30;

    // Determine days in period (default 30)
    const daysInPeriod = startDate && endDate
      ? Math.max(1, (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24))
      : 30;

    const totalPeriodFixedCost = dailyFixedCost * daysInPeriod;
    const totalLoads = loads.length || 1;

    const result = Array.from(groupMap.values()).map(item => {
      // Allocate fixed costs based on load count share
      const allocationFactor = item.loads / totalLoads;
      const allocatedFixedCost = totalPeriodFixedCost * allocationFactor;
      const netProfit = item.profit - allocatedFixedCost;

      return {
        ...item,
        margin: item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0,
        rpm: item.miles > 0 ? item.revenue / item.miles : 0,
        // Net financials
        allocatedFixedCost: Math.round(allocatedFixedCost),
        netProfit: netProfit,
        netMargin: item.revenue > 0 ? (netProfit / item.revenue) * 100 : 0
      };
    }).sort((a, b) => b.netProfit - a.netProfit); // Sort by Net Profit

    // Return extended data with summary
    return NextResponse.json({
      success: true,
      data: {
        breakdown: result,
        summary: {
          periodDays: Math.round(daysInPeriod),
          totalRevenue: loads.reduce((s, l) => s + Number(l.revenue || 0), 0),
          totalGrossProfit: loads.reduce((s, l) => s + Number(l.profit || 0), 0),
          totalFixedCosts: Math.round(totalPeriodFixedCost),
          totalNetProfit: loads.reduce((s, l) => s + Number(l.profit || 0), 0) - totalPeriodFixedCost,
          details: {
            monthlyTruckPayments,
            monthlyTrailerPayments,
            monthlySalaries,
            monthlyInsurance,
            estStaff: {
              dispatchers: estDispatchers,
              safety: estSafety,
              accounting: estAccounting
            }
          }
        }
      }
    });

  } catch (error: any) {
    console.error('Profitability analytics error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
