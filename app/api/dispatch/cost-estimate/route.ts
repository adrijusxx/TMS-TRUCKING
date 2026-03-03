import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CostEstimateManager } from '@/lib/managers/CostEstimateManager';

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
    const originState = searchParams.get('originState') || '';
    const destinationState = searchParams.get('destinationState') || '';
    const milesParam = searchParams.get('miles');
    const miles = milesParam ? parseFloat(milesParam) : undefined;

    const estimate = CostEstimateManager.estimateTripCost(
      originState,
      destinationState,
      miles
    );

    return NextResponse.json({ success: true, data: estimate });
  } catch (error) {
    console.error('Cost estimate error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
