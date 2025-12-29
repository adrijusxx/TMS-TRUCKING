import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AISettlementCalculator } from '@/lib/services/AISettlementCalculator';
import { z } from 'zod';

const settlementCalculationSchema = z.object({
  driverId: z.string().cuid('Invalid driver ID'),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
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
    const validated = settlementCalculationSchema.parse(body);

    const calculator = new AISettlementCalculator();
    const result = await calculator.calculateSettlement(
      session.user.companyId,
      validated.driverId,
      new Date(validated.periodStart),
      new Date(validated.periodEnd)
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }
    console.error('AI Settlement Calculator error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to calculate settlement',
        },
      },
      { status: 500 }
    );
  }
}



