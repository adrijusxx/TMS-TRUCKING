import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { BatchEmailManager } from '@/lib/managers/invoice/BatchEmailManager';

/**
 * GET /api/batches/:id/validate
 * Validates batch readiness — checks that every invoice has required documents and valid recipient email.
 */
export async function GET(
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

    const { id } = await params;

    // Verify batch belongs to company
    const batch = await prisma.invoiceBatch.findFirst({
      where: { id, companyId: session.user.companyId },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Batch not found' } },
        { status: 404 }
      );
    }

    const validation = await BatchEmailManager.validateBatch(id);

    return NextResponse.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error('Batch validation error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
