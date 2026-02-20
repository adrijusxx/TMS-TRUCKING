import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { filterSensitiveFields } from '@/lib/filters/sensitive-field-filter';
import { handleApiError } from '@/lib/api/route-helpers';

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
    // Always use buildMcNumberWhereClause - it handles "all" mode internally for admins
    const mcWhere = await buildMcNumberWhereClause(session, request);
    const viewingAll = !mcWhere.mcNumberId;

    // 4. Query with Company + MC filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const driverId = searchParams.get('driverId');
    const status = searchParams.get('status');

    // Build where clause - Settlement has no companyId, filter through driver relation
    const where: any = {
      driver: {
        companyId: session.user.companyId,
        deletedAt: null,
      },
    };

    // Settlement filters through driver.companyId and driver.mcNumberId
    // Add MC number filter only if applicable (not viewing all)
    if (!viewingAll && mcWhere.mcNumberId) {
      where.driver.mcNumberId = mcWhere.mcNumberId;
    }

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
    return handleApiError(error);
  }
}

