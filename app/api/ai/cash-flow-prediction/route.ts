import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AICashFlowPredictor } from '@/lib/services/AICashFlowPredictor';
import { z } from 'zod';

const cashFlowPredictionSchema = z.object({
  days: z.number().min(1).max(90).default(30),
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
    const validated = cashFlowPredictionSchema.parse(body);

    const predictor = new AICashFlowPredictor();
    const result = await predictor.predictCashFlow({
      companyId: session.user.companyId,
      days: validated.days,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI cash flow prediction error:', error);

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

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to predict cash flow',
        },
      },
      { status: 500 }
    );
  }
}



