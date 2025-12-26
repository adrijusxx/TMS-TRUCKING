import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
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
    const groupBy = searchParams.get('groupBy') || 'customer'; // customer, lane

    // Build MC filter - Load uses mcNumberId
    const loadMcWhere = await buildMcNumberWhereClause(session, request);

    // Get all loads in date range - include ALL loads, not just completed ones
    const loads = await prisma.load.findMany({
      where: {
        ...loadMcWhere,
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
            id: true,
            name: true,
          },
        },
        driver: {
          select: {
            id: true,
            payType: true,
            payRate: true,
          },
        },
      },
    });

    if (groupBy === 'customer') {
      // Group by customer
      const customerProfitability = loads.reduce((acc, load) => {
        const customerId = load.customerId;
        const customerName = load.customer.name;

        if (!acc[customerId]) {
          acc[customerId] = {
            customerId,
            customerName,
            totalLoads: 0,
            totalRevenue: 0,
            totalDriverPay: 0,
            totalExpenses: 0,
            totalProfit: 0,
            averageProfitPerLoad: 0,
          };
        }

        // Calculate driver pay: use load.driverPay if set, otherwise calculate from current driver payRate
        let calculatedDriverPay = load.driverPay || 0;
        if (!calculatedDriverPay && load.driver) {
          const miles = load.totalMiles || load.loadedMiles || load.emptyMiles || 0;
          if (load.driver.payType === 'PER_MILE' && miles > 0) {
            calculatedDriverPay = miles * load.driver.payRate;
          } else if (load.driver.payType === 'PER_LOAD') {
            calculatedDriverPay = load.driver.payRate;
          } else if (load.driver.payType === 'PERCENTAGE') {
            calculatedDriverPay = (load.revenue || 0) * (load.driver.payRate / 100);
          } else if (load.driver.payType === 'HOURLY') {
            const estimatedHours = miles > 0 ? miles / 50 : 10;
            calculatedDriverPay = estimatedHours * load.driver.payRate;
          }
        }

        acc[customerId].totalLoads += 1;
        acc[customerId].totalRevenue += Number(load.revenue) || 0;
        acc[customerId].totalDriverPay += calculatedDriverPay;
        acc[customerId].totalExpenses += Number(load.expenses) || 0;
        acc[customerId].totalProfit +=
          (Number(load.revenue) || 0) - calculatedDriverPay - (Number(load.expenses) || 0);

        return acc;
      }, {} as Record<string, any>);

      // Calculate averages
      Object.values(customerProfitability).forEach((customer: any) => {
        customer.averageProfitPerLoad =
          customer.totalLoads > 0
            ? customer.totalProfit / customer.totalLoads
            : 0;
      });

      const results = Object.values(customerProfitability)
        .map((customer: any) => ({
          ...customer,
          totalProfit: parseFloat(customer.totalProfit.toFixed(2)),
          averageProfitPerLoad: parseFloat(customer.averageProfitPerLoad.toFixed(2)),
        }))
        .sort((a: any, b: any) => b.totalProfit - a.totalProfit);

      return NextResponse.json({
        success: true,
        data: {
          groupBy: 'customer',
          results,
          summary: {
            totalCustomers: results.length,
            totalProfit: results.reduce((sum: number, r: any) => sum + r.totalProfit, 0),
            averageProfitPerCustomer: results.length > 0
              ? results.reduce((sum: number, r: any) => sum + r.totalProfit, 0) / results.length
              : 0,
          },
        },
      });
    } else {
      // Group by lane (origin-destination pair)
      const laneProfitability = loads.reduce((acc, load) => {
        const lane = `${load.pickupCity}, ${load.pickupState} → ${load.deliveryCity}, ${load.deliveryState}`;

        if (!acc[lane]) {
          acc[lane] = {
            lane,
            origin: `${load.pickupCity}, ${load.pickupState}`,
            destination: `${load.deliveryCity}, ${load.deliveryState}`,
            totalLoads: 0,
            totalRevenue: 0,
            totalDriverPay: 0,
            totalExpenses: 0,
            totalProfit: 0,
            averageProfitPerLoad: 0,
          };
        }

        // Calculate driver pay: use load.driverPay if set, otherwise calculate from current driver payRate
        let calculatedDriverPay = load.driverPay || 0;
        if (!calculatedDriverPay && load.driver) {
          const miles = load.totalMiles || load.loadedMiles || load.emptyMiles || 0;
          if (load.driver.payType === 'PER_MILE' && miles > 0) {
            calculatedDriverPay = miles * load.driver.payRate;
          } else if (load.driver.payType === 'PER_LOAD') {
            calculatedDriverPay = load.driver.payRate;
          } else if (load.driver.payType === 'PERCENTAGE') {
            calculatedDriverPay = (load.revenue || 0) * (load.driver.payRate / 100);
          } else if (load.driver.payType === 'HOURLY') {
            const estimatedHours = miles > 0 ? miles / 50 : 10;
            calculatedDriverPay = estimatedHours * load.driver.payRate;
          }
        }

        acc[lane].totalLoads += 1;
        acc[lane].totalRevenue += Number(load.revenue) || 0;
        acc[lane].totalDriverPay += calculatedDriverPay;
        acc[lane].totalExpenses += Number(load.expenses) || 0;
        acc[lane].totalProfit +=
          (Number(load.revenue) || 0) - calculatedDriverPay - (Number(load.expenses) || 0);

        return acc;
      }, {} as Record<string, any>);

      // Calculate averages
      Object.values(laneProfitability).forEach((lane: any) => {
        lane.averageProfitPerLoad =
          lane.totalLoads > 0 ? lane.totalProfit / lane.totalLoads : 0;
      });

      const results = Object.values(laneProfitability)
        .map((lane: any) => ({
          ...lane,
          totalProfit: parseFloat(lane.totalProfit.toFixed(2)),
          averageProfitPerLoad: parseFloat(lane.averageProfitPerLoad.toFixed(2)),
        }))
        .sort((a: any, b: any) => b.totalProfit - a.totalProfit);

      return NextResponse.json({
        success: true,
        data: {
          groupBy: 'lane',
          results,
          summary: {
            totalLanes: results.length,
            totalProfit: results.reduce((sum: number, r: any) => sum + r.totalProfit, 0),
            averageProfitPerLane: results.length > 0
              ? results.reduce((sum: number, r: any) => sum + r.totalProfit, 0) / results.length
              : 0,
          },
        },
      });
    }
  } catch (error) {
    console.error('Profitability analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

