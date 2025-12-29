import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
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

    return NextResponse.json({
      success: true,
      data: advances,
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





