import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause, getCurrentMcNumber } from '@/lib/mc-number-filter';
import { getSettlementFilter, createFilterContext } from '@/lib/filters/role-data-filter';
import { filterSensitiveFields } from '@/lib/filters/sensitive-field-filter';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const driverId = searchParams.get('driverId');
    const status = searchParams.get('status');
    const mcViewMode = searchParams.get('mc'); // 'all', 'current', or specific MC ID
    const isAdmin = session.user?.role === 'ADMIN';

    // Build base filter with MC number if applicable
    let baseFilter = await buildMcNumberWhereClause(session, request);
    
    // Admin-only: Override MC filter based on view mode
    if (isAdmin && mcViewMode === 'all') {
      // Remove MC number filter to show all MCs (admin only)
      if (baseFilter.mcNumber) {
        delete baseFilter.mcNumber;
      }
    } else if (isAdmin && mcViewMode && mcViewMode !== 'current' && mcViewMode !== null) {
      // Filter by specific MC number ID (admin selecting specific MC)
      const mcNumberRecord = await prisma.mcNumber.findUnique({
        where: { id: mcViewMode },
        select: { number: true, companyId: true },
      });
      if (mcNumberRecord) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { companyId: true, userCompanies: { select: { companyId: true } } },
        });
        const accessibleCompanyIds = [
          user?.companyId,
          ...(user?.userCompanies?.map((uc) => uc.companyId) || []),
        ].filter(Boolean) as string[];
        
        if (accessibleCompanyIds.includes(mcNumberRecord.companyId)) {
          baseFilter = {
            ...baseFilter,
            mcNumber: mcNumberRecord.number,
          };
        }
      }
    }
    // Non-admin users: always use baseFilter (their assigned MC)

    // Convert mcNumber string to mcNumberId for driver relation filter
    // Driver.mcNumber is a relation, not a string field, so we need to use mcNumberId
    let driverFilter: any = {
      companyId: baseFilter.companyId,
    };

    if (baseFilter.mcNumber) {
      // Look up the MC number record to get its ID
      const mcRecord = await prisma.mcNumber.findFirst({
        where: {
          companyId: session.user.companyId,
          OR: [
            { number: baseFilter.mcNumber },
            { companyName: { contains: baseFilter.mcNumber, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
        select: { id: true },
      });

      if (mcRecord) {
        driverFilter.mcNumberId = mcRecord.id;
      }
    }

    // Apply role-based filtering
    const roleFilter = await getSettlementFilter(
      createFilterContext(
        session.user.id,
        session.user.role as any,
        session.user.companyId
      )
    );

    // Merge role filter with driver filter
    const where: any = {
      ...roleFilter,
      driver: driverFilter,
    };

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

    // Filter sensitive fields based on role
    const filteredSettlements = settlements.map((settlement) =>
      filterSensitiveFields(settlement, session.user.role as any)
    );

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

