import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { findLoadsReadyForInvoicing } from '@/lib/automation/load-status';

/**
 * Get loads that are ready to be invoiced
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

    const loads = await findLoadsReadyForInvoicing(session.user.companyId);

    // Group by customer
    const byCustomer = loads.reduce((acc, load) => {
      const customerId = load.customerId;
      if (!acc[customerId]) {
        acc[customerId] = {
          customer: load.customer,
          loads: [],
          totalRevenue: 0,
        };
      }
      acc[customerId].loads.push(load);
      acc[customerId].totalRevenue += load.revenue;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      data: {
        totalLoads: loads.length,
        byCustomer: Object.values(byCustomer),
        loads: loads.map((load) => ({
          id: load.id,
          loadNumber: load.loadNumber,
          customer: {
            id: load.customer.id,
            name: load.customer.name,
          },
          revenue: load.revenue,
          deliveredAt: load.deliveredAt,
        })),
      },
    });
  } catch (error) {
    console.error('Invoice ready check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

