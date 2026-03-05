import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
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
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

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

    // Date range filtering
    if (fromDate || toDate) {
      where.periodEnd = {};
      if (fromDate) where.periodEnd.gte = new Date(fromDate);
      if (toDate) where.periodEnd.lte = new Date(toDate);
    }

    const [settlements, total, aggregates] = await Promise.all([
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
              mcNumber: { select: { number: true } },
              currentTruck: { select: { truckNumber: true } },
            },
          },
          salaryBatch: {
            select: {
              id: true,
              batchNumber: true,
            },
          },
          deductionItems: {
            select: {
              amount: true,
              quantity: true,
              category: true,
              loadExpenseId: true,
            },
          },
        },
        orderBy: { periodEnd: 'desc' },
        skip,
        take: limit,
      }),
      prisma.settlement.count({ where }),
      prisma.settlement.aggregate({
        where,
        _sum: { grossPay: true, deductions: true, advances: true, netPay: true },
      }),
    ]);

    // 5. Enrich settlements with computed financial columns
    const allLoadIds = [...new Set(settlements.flatMap(s => s.loadIds || []))];
    const loadFinancials = allLoadIds.length > 0
      ? await prisma.load.findMany({
          where: { id: { in: allLoadIds } },
          select: { id: true, revenue: true, driverPay: true },
        })
      : [];
    const loadMap = new Map(loadFinancials.map(l => [l.id, l]));

    const enrichedSettlements = settlements.map(s => {
      let totalRevenue = 0;
      let totalLoadPay = 0;
      for (const lid of (s.loadIds || [])) {
        const load = loadMap.get(lid);
        if (load) {
          totalRevenue += load.revenue || 0;
          totalLoadPay += load.driverPay || 0;
        }
      }
      const expense = (s.deductionItems || [])
        .filter((d: any) => d.loadExpenseId)
        .reduce((sum: number, d: any) => sum + d.amount * (d.quantity ?? 1), 0);
      const otherPay = (s.deductionItems || [])
        .filter((d: any) => d.category === 'addition')
        .reduce((sum: number, d: any) => sum + d.amount * (d.quantity ?? 1), 0);

      const { deductionItems, ...rest } = s;
      return { ...rest, totalRevenue, totalLoadPay, expense, otherPay };
    });

    // 6. Filter Sensitive Fields based on role
    const filteredSettlements = enrichedSettlements.map((settlement) =>
      filterSensitiveFields(settlement, session.user.role as any)
    );

    // 7. Return Success Response
    return NextResponse.json({
      success: true,
      data: filteredSettlements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totals: {
          grossPay: aggregates._sum.grossPay || 0,
          deductions: aggregates._sum.deductions || 0,
          advances: aggregates._sum.advances || 0,
          netPay: aggregates._sum.netPay || 0,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

