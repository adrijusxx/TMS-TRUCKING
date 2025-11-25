import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIVerificationService } from '@/lib/services/AIVerificationService';
import { z } from 'zod';

const verificationService = new AIVerificationService();

// GET - Get pending suggestions
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
    const suggestionType = searchParams.get('suggestionType');
    const entityType = searchParams.get('entityType');
    const minConfidence = searchParams.get('minConfidence');

    const suggestions = await verificationService.getPendingSuggestions(
      session.user.companyId,
      {
        ...(suggestionType && { suggestionType }),
        ...(entityType && { entityType }),
        ...(minConfidence && { minConfidence: parseFloat(minConfidence) }),
      }
    );

    return NextResponse.json({ success: true, data: suggestions });
  } catch (error) {
    console.error('AI Verification API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get pending suggestions',
        },
      },
      { status: 500 }
    );
  }
}

// POST - Create suggestion
const createSuggestionSchema = z.object({
  suggestionType: z.string(),
  entityType: z.string(),
  entityId: z.string().optional(),
  aiConfidence: z.number().min(0).max(100),
  aiReasoning: z.string(),
  suggestedValue: z.any(),
  originalValue: z.any().optional(),
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
    const validatedData = createSuggestionSchema.parse(body);

    const suggestion = await verificationService.createSuggestion({
      ...validatedData,
      companyId: session.user.companyId,
    });

    return NextResponse.json({ success: true, data: suggestion });
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
    console.error('AI Verification API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create suggestion',
        },
      },
      { status: 500 }
    );
  }
}



