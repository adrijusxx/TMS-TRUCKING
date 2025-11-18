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
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();
    const groupBy = searchParams.get('groupBy') || 'customer'; // customer, lane

    // Get all completed loads in date range
    const loads = await prisma.load.findMany({
      where: {
        companyId: session.user.companyId,
        status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
        deliveredAt: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
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

        acc[customerId].totalLoads += 1;
        acc[customerId].totalRevenue += load.revenue;
        acc[customerId].totalDriverPay += load.driverPay || 0;
        acc[customerId].totalExpenses += load.expenses || 0;
        acc[customerId].totalProfit +=
          load.revenue - (load.driverPay || 0) - (load.expenses || 0);
        
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

        acc[lane].totalLoads += 1;
        acc[lane].totalRevenue += load.revenue;
        acc[lane].totalDriverPay += load.driverPay || 0;
        acc[lane].totalExpenses += load.expenses || 0;
        acc[lane].totalProfit +=
          load.revenue - (load.driverPay || 0) - (load.expenses || 0);
        
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

