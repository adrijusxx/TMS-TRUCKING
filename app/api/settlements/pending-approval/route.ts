import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Get all settlements pending approval
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where = {
      driver: {
        companyId: session.user.companyId,
      },
      approvalStatus: 'PENDING' as const,
    };

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
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
          deductionItems: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.settlement.count({ where }),
    ]);

    // Calculate summary statistics
    const totalAmount = settlements.reduce((sum, s) => sum + s.netPay, 0);
    const totalDeductions = settlements.reduce((sum, s) => {
      const deductions = (s as any).deductionItems || [];
      return sum + deductions.reduce((dSum: number, d: any) => dSum + d.amount, 0);
    }, 0);

    return NextResponse.json({
      success: true,
      data: settlements,
      summary: {
        totalSettlements: total,
        totalAmount,
        totalDeductions,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error getting pending settlements:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to get pending settlements',
        },
      },
      { status: 500 }
    );
  }
}

