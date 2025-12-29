import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIVerificationService } from '@/lib/services/AIVerificationService';
import { z } from 'zod';

const verificationService = new AIVerificationService();

const approveSuggestionSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
});

export async function PATCH(
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
    const body = await request.json();
    const validatedData = approveSuggestionSchema.parse(body);

    // Verify suggestion belongs to company
    const suggestion = await verificationService.getSuggestion(id);
    if (!suggestion || suggestion.companyId !== session.user.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Suggestion not found' } },
        { status: 404 }
      );
    }

    const updated = await verificationService.approveSuggestion({
      suggestionId: id,
      reviewedById: session.user.id,
      approved: validatedData.approved,
      rejectionReason: validatedData.rejectionReason,
    });

    return NextResponse.json({ success: true, data: updated });
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
    console.error('AI Verification Approve API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to approve/reject suggestion',
        },
      },
      { status: 500 }
    );
  }
}



