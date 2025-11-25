import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AICustomerIntelligence } from '@/lib/services/AICustomerIntelligence';

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
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'customerId is required' } },
        { status: 400 }
      );
    }

    const intelligence = new AICustomerIntelligence();
    const result = await intelligence.getCustomerIntelligence(session.user.companyId, customerId);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('AI Customer Intelligence error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get customer intelligence',
        },
      },
      { status: 500 }
    );
  }
}



