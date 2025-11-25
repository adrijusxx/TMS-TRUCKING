import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIDriverRetentionPredictor } from '@/lib/services/AIDriverRetentionPredictor';

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

    if (!driverId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'driverId is required' } },
        { status: 400 }
      );
    }

    const predictor = new AIDriverRetentionPredictor();
    const result = await predictor.predictDriverRetention(session.user.companyId, driverId);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('AI Driver Retention error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to predict driver retention',
        },
      },
      { status: 500 }
    );
  }
}



