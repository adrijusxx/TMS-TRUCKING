import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { DriverAdvanceManager } from '@/lib/managers/DriverAdvanceManager';

/**
 * Get advance history for a specific driver
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const driverId = resolvedParams.driverId;

    // Verify driver belongs to company
    const driver = await prisma.driver.findFirst({
      where: {
        id: driverId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Driver not found' },
        },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get advance history
    const advanceManager = new DriverAdvanceManager();
    const [history, balance] = await Promise.all([
      advanceManager.getDriverAdvanceHistory(driverId, limit),
      advanceManager.getDriverAdvanceBalance(driverId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        driverId,
        outstandingBalance: balance,
        advanceLimit: driver.advanceLimit,
        availableCredit: driver.advanceLimit - balance,
        history,
      },
    });
  } catch (error: any) {
    console.error('Error getting driver advance history:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to get advance history',
        },
      },
      { status: 500 }
    );
  }
}





