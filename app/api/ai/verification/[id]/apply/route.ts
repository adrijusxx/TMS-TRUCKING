import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIVerificationService } from '@/lib/services/AIVerificationService';

const verificationService = new AIVerificationService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify suggestion belongs to company
    const suggestion = await verificationService.getSuggestion(id);
    if (!suggestion || suggestion.companyId !== session.user.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Suggestion not found' } },
        { status: 404 }
      );
    }

    const applied = await verificationService.applySuggestion({
      suggestionId: id,
      appliedById: session.user.id,
    });

    return NextResponse.json({ success: true, data: applied });
  } catch (error) {
    console.error('AI Verification Apply API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to apply suggestion',
        },
      },
      { status: 500 }
    );
  }
}



