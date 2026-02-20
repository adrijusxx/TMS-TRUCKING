import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { runWeeklySettlementGeneration, triggerManualSettlementGeneration } from '@/lib/automation/settlement-generation';
import { z } from 'zod';

const manualTriggerSchema = z.object({
  companyId: z.string().cuid().optional(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
});

/**
 * Manually trigger settlement generation
 * Can be used by admins or called by external cron services
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only ADMIN can trigger manual settlement generation
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only administrators can trigger settlement generation' },
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validated = manualTriggerSchema.parse(body);

    const periodStart = validated.periodStart ? new Date(validated.periodStart) : undefined;
    const periodEnd = validated.periodEnd ? new Date(validated.periodEnd) : undefined;

    // Trigger settlement generation
    const result = await triggerManualSettlementGeneration(
      validated.companyId,
      periodStart,
      periodEnd
    );

    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error: any) {
    console.error('Error triggering settlement generation:', error);

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
          message: error.message || 'Failed to trigger settlement generation',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Get status of last settlement generation run
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Get last cron execution from activity log
    const { prisma } = await import('@/lib/prisma');
    const lastRun = await prisma.activityLog.findFirst({
      where: {
        action: 'CRON_SETTLEMENT_GENERATION',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: lastRun
        ? {
            lastRun: lastRun.createdAt,
            details: lastRun.metadata,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Error getting settlement generation status:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to get status',
        },
      },
      { status: 500 }
    );
  }
}

