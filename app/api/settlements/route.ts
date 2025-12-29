import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause, getCurrentMcNumber } from '@/lib/mc-number-filter';
import { getSettlementFilter, createFilterContext } from '@/lib/filters/role-data-filter';
import { filterSensitiveFields } from '@/lib/filters/sensitive-field-filter';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // 2. Permission Check
    // Note: Add hasPermission import and check if needed

    // 3. Build MC Filter (respects admin "all" view, user MC access, current selection)
    const isAdmin = (session?.user as any)?.role === 'ADMIN';
    const viewingAll = isAdmin;
    
    let mcWhere: { companyId?: string; mcNumberId?: string | { in: string[] } };
    
    if (!viewingAll) {
      mcWhere = await buildMcNumberWhereClause(session, request);
    } else {
      // Admin viewing all - no filtering
      mcWhere = {};
    }

    // 4. Query with Company + MC filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const driverId = searchParams.get('driverId');
    const status = searchParams.get('status');

    // Apply role-based filtering with MC context
    const roleFilter = await getSettlementFilter(
      createFilterContext(
        session.user.id,
        session.user.role as any,
        viewingAll ? 'ADMIN_ALL_COMPANIES' : session.user.companyId,
        mcWhere.mcNumberId
      )
    );

    // Build where clause
    const where: any = viewingAll ? {} : { ...roleFilter, ...mcWhere };

    if (driverId) {
      where.driverId = driverId;
    }

    if (status) {
      where.status = status;
    }

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where,
        include: {
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
        orderBy: { periodEnd: 'desc' },
        skip,
        take: limit,
      }),
      prisma.settlement.count({ where }),
    ]);

    // 5. Filter Sensitive Fields based on role
    const filteredSettlements = settlements.map((settlement) =>
      filterSensitiveFields(settlement, session.user.role as any)
    );

    // 6. Return Success Response
    return NextResponse.json({
      success: true,
      data: filteredSettlements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Settlement list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

