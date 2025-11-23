import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { IFTAManager } from '@/lib/managers/IFTAManager';
import { z } from 'zod';

const calculateSchema = z.object({
  loadId: z.string(),
  periodType: z.enum(['QUARTER', 'MONTH']),
  periodYear: z.number().int().min(2020).max(2100),
  periodQuarter: z.number().int().min(1).max(4).optional(),
  periodMonth: z.number().int().min(1).max(12).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = calculateSchema.parse(body);

    // Validate period-specific fields
    if (validated.periodType === 'QUARTER' && !validated.periodQuarter) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'periodQuarter is required for QUARTER type' },
        },
        { status: 400 }
      );
    }

    if (validated.periodType === 'MONTH' && !validated.periodMonth) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'periodMonth is required for MONTH type' },
        },
        { status: 400 }
      );
    }

    const entryId = await IFTAManager.createOrUpdateIFTAEntry(
      validated.loadId,
      session.user.companyId,
      validated.periodType,
      validated.periodYear,
      validated.periodQuarter,
      validated.periodMonth
    );

    return NextResponse.json({
      success: true,
      data: { entryId },
    });
  } catch (error) {
    console.error('IFTA calculate error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to calculate IFTA',
        },
      },
      { status: 500 }
    );
  }
}





