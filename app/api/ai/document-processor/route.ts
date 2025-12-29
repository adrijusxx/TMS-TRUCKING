import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIDocumentProcessor } from '@/lib/services/AIDocumentProcessor';
import { z } from 'zod';

const documentProcessingSchema = z.object({
  documentType: z.enum(['INVOICE', 'RECEIPT', 'SAFETY_DOCUMENT', 'INSURANCE', 'MAINTENANCE_RECORD', 'OTHER']),
  text: z.string().min(1, 'Document text is required'),
  fileName: z.string().optional(),
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
    const validated = documentProcessingSchema.parse(body);

    const processor = new AIDocumentProcessor();
    const result = await processor.processDocument({
      documentType: validated.documentType,
      text: validated.text,
      fileName: validated.fileName,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI document processing error:', error);

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
          message: error instanceof Error ? error.message : 'Failed to process document',
        },
      },
      { status: 500 }
    );
  }
}



