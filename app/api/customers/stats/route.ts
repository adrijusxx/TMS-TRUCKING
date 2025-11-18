import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Get customer statistics
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

    // Build where clause from filters
    const where: any = {
      companyId: session.user.companyId,
      isActive: true,
      deletedAt: null,
    };

    // Apply filters
    const search = searchParams.get('search');
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { customerNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get stats
    const [totalCustomers, customerLoads] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        include: {
          loads: {
            where: {
              deletedAt: null,
            },
            select: {
              revenue: true,
            },
          },
        },
      }),
    ]);

    const activeCustomers = customerLoads.filter((c) => c.loads.length > 0).length;
    const totalLoads = customerLoads.reduce((sum, c) => sum + c.loads.length, 0);
    const revenue = customerLoads.reduce(
      (sum, c) => sum + c.loads.reduce((loadSum, load) => loadSum + (load.revenue || 0), 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        totalCustomers,
        activeCustomers,
        totalRevenue: revenue,
        totalLoads,
      },
    });
  } catch (error) {
    console.error('Customer stats fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

