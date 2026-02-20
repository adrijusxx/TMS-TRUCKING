import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { SettlementManager } from '@/lib/managers/SettlementManager';
import { z } from 'zod';

const autoGenerateSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  driverIds: z.array(z.string().cuid()).optional(),
});

/**
 * Auto-generate settlements for drivers (used by cron job or manual trigger)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only ADMIN and ACCOUNTANT can trigger auto-generation
    if (session.user.role !== 'ADMIN' && session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = autoGenerateSchema.parse(body);

    const periodStart = new Date(validated.periodStart);
    const periodEnd = new Date(validated.periodEnd);

    // Get drivers to generate settlements for
    let driverIds = validated.driverIds;
    if (!driverIds || driverIds.length === 0) {
      // Get all active drivers in the company
      const drivers = await prisma.driver.findMany({
        where: {
          companyId: session.user.companyId,
          status: 'AVAILABLE',
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });
      driverIds = drivers.map((d) => d.id);
    }

    // Generate settlements for all drivers
    const settlementManager = new SettlementManager();
    const results = await Promise.allSettled(
      driverIds.map((driverId) =>
        settlementManager.generateSettlement({
          driverId,
          periodStart,
          periodEnd,
        })
      )
    );

    // Categorize results
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    const errors = results
      .filter((r) => r.status === 'rejected')
      .map((r: any) => r.reason?.message || 'Unknown error');

    // Get generated settlements
    const settlements = results
      .filter((r) => r.status === 'fulfilled')
      .map((r: any) => r.value);

    return NextResponse.json({
      success: true,
      data: {
        periodStart,
        periodEnd,
        totalDrivers: driverIds.length,
        successful,
        failed,
        settlements,
        errors: failed > 0 ? errors : undefined,
      },
    });
  } catch (error: any) {
    console.error('Error auto-generating settlements:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to auto-generate settlements',
        },
      },
      { status: 500 }
    );
  }
}

