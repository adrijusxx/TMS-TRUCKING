import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIDocumentProcessor } from '@/lib/services/AIDocumentProcessor';
import { AIVerificationService } from '@/lib/services/AIVerificationService';
import { z } from 'zod';

const documentIntelligenceSchema = z.object({
  documentText: z.string().min(1, 'Document text is required'),
  documentType: z.string().optional(),
  autoFile: z.boolean().optional().default(false),
});

const verificationService = new AIVerificationService();

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
    const validated = documentIntelligenceSchema.parse(body);

    const processor = new AIDocumentProcessor();
    const categorization = await processor.categorizeAndFileDocument(
      validated.documentText,
      session.user.companyId,
      validated.documentType
    );

    // If financial data extracted, create suggestion for approval
    if (categorization.extractedFinancialData?.amount && categorization.extractedFinancialData.amount >= 100) {
      await verificationService.createSuggestion({
        companyId: session.user.companyId,
        suggestionType: 'DOCUMENT_FINANCIAL_EXTRACTION',
        entityType: categorization.suggestedEntityType || 'DOCUMENT',
        entityId: categorization.suggestedEntityId,
        aiConfidence: categorization.confidence,
        aiReasoning: `Extracted financial data from document: $${categorization.extractedFinancialData.amount}`,
        suggestedValue: categorization.extractedFinancialData,
      });
    }

    return NextResponse.json({
      success: true,
      data: categorization,
    });
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
    console.error('AI Document Intelligence error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process document',
        },
      },
      { status: 500 }
    );
  }
}



