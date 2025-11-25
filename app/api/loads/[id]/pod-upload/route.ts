import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { LoadCompletionManager } from '@/lib/managers/LoadCompletionManager';
import { z } from 'zod';

const podUploadSchema = z.object({
  documentId: z.string().cuid(),
  notes: z.string().optional(),
});

/**
 * Upload POD and trigger accounting sync if load is delivered
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const loadId = resolvedParams.id;
    const body = await request.json();
    const validated = podUploadSchema.parse(body);

    // Verify load belongs to company
    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!load) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Load not found' },
        },
        { status: 404 }
      );
    }

    // Verify document exists and is a POD
    const document = await prisma.document.findFirst({
      where: {
        id: validated.documentId,
        loadId,
        type: 'POD',
      },
    });

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_DOCUMENT', message: 'POD document not found' },
        },
        { status: 404 }
      );
    }

    // Trigger POD upload handler
    const completionManager = new LoadCompletionManager();
    await completionManager.handlePODUpload(loadId, validated.documentId);

    // If load is delivered, trigger full completion workflow
    let completionResult = null;
    if (load.status === 'DELIVERED') {
      completionResult = await completionManager.handleLoadCompletion(loadId);
    }

    return NextResponse.json({
      success: true,
      data: {
        loadId,
        podUploaded: true,
        podUploadedAt: new Date(),
        completionTriggered: load.status === 'DELIVERED',
        completionResult,
      },
    });
  } catch (error: any) {
    console.error('Error uploading POD:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
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
          message: error.message || 'Failed to upload POD',
        },
      },
      { status: 500 }
    );
  }
}





