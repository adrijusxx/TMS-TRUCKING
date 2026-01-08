/**
 * Settlement Generation Trigger API
 * 
 * Triggers settlement generation via Inngest background jobs.
 * Can be called manually from UI or via cron webhook.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { inngest } from '@/lib/inngest/client';
import { z } from 'zod';

const triggerSchema = z.object({
  companyId: z.string().cuid().optional(),
  period: z.enum(['last_week', 'custom']).optional(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only ADMIN and ACCOUNTANT can trigger settlement generation
    if (!['ADMIN', 'ACCOUNTANT'].includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validated = triggerSchema.parse(body);

    // Calculate period dates if not provided
    let periodStart: string | undefined;
    let periodEnd: string | undefined;

    if (validated.period === 'last_week' || !validated.periodStart) {
      const end = new Date();
      end.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - end.getDay()); // Last Sunday

      const start = new Date(end);
      start.setDate(start.getDate() - 6); // Previous Monday

      periodStart = start.toISOString();
      periodEnd = end.toISOString();
    } else {
      periodStart = validated.periodStart;
      periodEnd = validated.periodEnd;
    }

    // Send event to Inngest with Fallback
    try {
      const targetCompanyId = validated.companyId || session.user.companyId;

      await inngest.send({
        name: 'settlement/generate-for-company',
        data: {
          companyId: targetCompanyId,
          periodStart,
          periodEnd,
        },
      });
    } catch (inngestError: any) {
      console.warn('Inngest unavailable, falling back to direct execution:', inngestError.message);

      // Fallback: Execute logic directly (Sync)
      // This is helpful for local dev where Inngest might not be configured
      const { processCompanySettlements } = await import('@/lib/inngest/functions/generate-settlements');
      const targetCompanyId = validated.companyId || session.user.companyId;

      const simpleLogger = {
        info: (msg: string) => console.log(`[DirectSettlement] ${msg}`),
        error: (msg: string, e?: unknown) => console.error(`[DirectSettlement] ${msg}`, e),
      };

      // Run async but don't await to avoid blocking the response significantly? 
      // Actually for "Manual Batch" waiting is fine, but Vercel timeout is 10s.
      // We'll await it to ensure it works, but log warnings.
      await processCompanySettlements(
        targetCompanyId,
        new Date(periodStart!),
        new Date(periodEnd!),
        simpleLogger
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Settlement generation started',
        periodStart,
        periodEnd,
      },
    });
  } catch (error: unknown) {
    console.error('Error triggering settlement generation:', error);

    if (error instanceof z.ZodError) {
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

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message },
      },
      { status: 500 }
    );
  }
}

/**
 * Get last generation status
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const { prisma } = await import('@/lib/prisma');

    const lastRun = await prisma.activityLog.findFirst({
      where: {
        action: { in: ['INNGEST_SETTLEMENT_GENERATION', 'CRON_SETTLEMENT_GENERATION'] },
        companyId: session.user.companyId,
      },
      orderBy: { createdAt: 'desc' },
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}



