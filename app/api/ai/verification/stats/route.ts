import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIVerificationService } from '@/lib/services/AIVerificationService';

const verificationService = new AIVerificationService();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const stats = await verificationService.getSuggestionStats(session.user.companyId);

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('AI Verification Stats API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get suggestion stats',
        },
      },
      { status: 500 }
    );
  }
}



