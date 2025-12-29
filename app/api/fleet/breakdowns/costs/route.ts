import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/fleet/breakdowns/costs
 * List breakdowns with cost details
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const truckId = searchParams.get('truckId');
    const minCost = searchParams.get('minCost');

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
      totalCost: {
        gt: 0, // Only breakdowns with costs
      },
    };

    if (startDate || endDate) {
      where.reportedAt = {};
      if (startDate) {
        where.reportedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.reportedAt.lte = new Date(endDate);
      }
    }

    if (truckId) {
      where.truckId = truckId;
    }

    if (minCost) {
      where.totalCost = {
        ...where.totalCost,
        gte: parseFloat(minCost),
      };
    }

    const [breakdowns, total] = await Promise.all([
      prisma.breakdown.findMany({
        where,
        include: {
          truck: {
            select: {
              id: true,
              truckNumber: true,
            },
          },
        },
        orderBy: {
          totalCost: 'desc', // Highest cost first
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.breakdown.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        breakdowns,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching breakdown costs:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch breakdown costs',
        },
      },
      { status: 500 }
    );
  }
}

