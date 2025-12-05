/**
 * IFTA Calculation API
 * 
 * Triggers IFTA calculations via Inngest background jobs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { inngest } from '@/lib/inngest/client';
import { z } from 'zod';

const calculateSchema = z.object({
  quarter: z.number().min(1).max(4),
  year: z.number().min(2020).max(2100),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    // Only ADMIN and ACCOUNTANT can trigger IFTA calculations
    if (!['ADMIN', 'ACCOUNTANT'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { quarter, year } = calculateSchema.parse(body);

    // Send event to Inngest
    await inngest.send({
      name: 'ifta/calculate-quarter',
      data: {
        companyId: session.user.companyId,
        quarter,
        year,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `IFTA calculation started for Q${quarter} ${year}`,
        quarter,
        year,
      },
    });
  } catch (error: unknown) {
    console.error('Error triggering IFTA calculation:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', details: error.issues },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}
