import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DriverAdvanceManager } from '@/lib/managers/DriverAdvanceManager';

/**
 * List driver advances with filters
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
    const driverId = searchParams.get('driverId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {
      driver: {
        companyId: session.user.companyId,
      },
    };

    if (driverId) {
      where.driverId = driverId;
    }

    if (status) {
      where.approvalStatus = status;
    }

    const [advances, total] = await Promise.all([
      prisma.driverAdvance.findMany({
        where,
        include: {
          driver: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          approvedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          load: {
            select: {
              loadNumber: true,
            },
          },
          settlement: {
            select: {
              settlementNumber: true,
            },
          },
        },
        orderBy: {
          requestDate: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.driverAdvance.count({ where }),
    ]);

    // Optionally include negative balances per driver
    const includeNegativeBalance = searchParams.get('includeNegativeBalance') === 'true';
    let negativeBalances: { driverId: string; _sum: { amount: number | null } }[] = [];

    if (includeNegativeBalance) {
      const grouped = await prisma.driverNegativeBalance.groupBy({
        by: ['driverId'],
        where: {
          isApplied: false,
          driver: { companyId: session.user.companyId },
        },
        _sum: { amount: true },
      });
      negativeBalances = grouped.map((g) => ({ driverId: g.driverId, _sum: { amount: g._sum.amount } }));
    }

    return NextResponse.json({
      success: true,
      data: advances,
      ...(includeNegativeBalance && {
        negativeBalances: negativeBalances.map((nb) => ({
          driverId: nb.driverId,
          amount: nb._sum.amount || 0,
        })),
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error listing advances:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to list advances',
        },
      },
      { status: 500 }
    );
  }
}





