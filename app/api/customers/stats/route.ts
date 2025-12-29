import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

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

    // Build MC filter (respects admin "all" view, user MC access, current selection)
    const mcWhere = await buildMcNumberWhereClause(session, request);

    // Convert mcNumberId to mcNumber string for Customer model (Customer still uses mcNumber string)
    let customerWhere: any = {
      companyId: mcWhere.companyId,
      isActive: true,
      deletedAt: null,
    };

    // If filtering by MC, convert mcNumberId to mcNumber string
    if (mcWhere.mcNumberId) {
      if (typeof mcWhere.mcNumberId === 'string') {
        const mcNumber = await prisma.mcNumber.findUnique({
          where: { id: mcWhere.mcNumberId },
          select: { number: true },
        });
        if (mcNumber) {
          customerWhere.mcNumber = mcNumber.number;
        }
      } else if (typeof mcWhere.mcNumberId === 'object' && 'in' in mcWhere.mcNumberId) {
        const mcNumbers = await prisma.mcNumber.findMany({
          where: { id: { in: mcWhere.mcNumberId.in }, companyId: mcWhere.companyId },
          select: { number: true },
        });
        const mcNumberValues = mcNumbers.map(mc => mc.number?.trim()).filter((n): n is string => !!n);
        if (mcNumberValues.length > 0) {
          customerWhere.mcNumber = { in: mcNumberValues };
        }
      }
    }

    // Build where clause from filters
    const where: any = {
      ...customerWhere,
    };

    // Apply filters
    const search = searchParams.get('search');
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { customerNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build load filter (Load uses mcNumberId)
    let loadWhere: any = {
      deletedAt: null,
    };
    if (mcWhere.mcNumberId) {
      loadWhere.mcNumberId = mcWhere.mcNumberId;
    } else if (mcWhere.companyId) {
      loadWhere.companyId = mcWhere.companyId;
    }

    // Get stats
    const [totalCustomers, customerLoads] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        select: {
          id: true,
          loads: {
            where: loadWhere,
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

