import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIBreakdownPredictor } from '@/lib/services/AIBreakdownPredictor';

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
    const truckId = searchParams.get('truckId');

    if (!truckId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'truckId is required' } },
        { status: 400 }
      );
    }

    const predictor = new AIBreakdownPredictor();
    const result = await predictor.predictBreakdowns(session.user.companyId, truckId);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('AI Breakdown Prediction error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to predict breakdowns',
        },
      },
      { status: 500 }
    );
  }
}



