import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { BatchEmailManager } from '@/lib/managers/invoice/BatchEmailManager';

/**
 * POST /api/batches/:id/send
 * Validates the batch, then sends emails with merged PDF packages to all invoice recipients.
 * Blocks if any invoice is missing required documents or a valid recipient email.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const batch = await prisma.invoiceBatch.findFirst({
      where: { id, companyId: session.user.companyId },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Batch not found' } },
        { status: 404 }
      );
    }

    if (batch.postStatus === 'PAID') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: 'Cannot send a PAID batch' } },
        { status: 400 }
      );
    }

    // Validate all invoices before sending
    const validation = await BatchEmailManager.validateBatch(id);
    if (!validation.ready) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: `${validation.errors.length} invoice(s) have issues that must be resolved before sending`,
            validationErrors: validation.errors,
          },
        },
        { status: 400 }
      );
    }

    // Send all emails
    const sendResult = await BatchEmailManager.sendBatch(
      id,
      session.user.companyId,
      session.user.id
    );

    // Log activity
    try {
      const { createActivityLog } = await import('@/lib/activity-log');
      await createActivityLog({
        companyId: session.user.companyId,
        userId: session.user.id,
        action: 'SEND',
        entityType: 'Invoice',
        entityId: id,
        description: `Batch ${batch.batchNumber} sent: ${sendResult.totalSent} succeeded, ${sendResult.totalFailed} failed`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    } catch {
      // Activity log failure should not fail the request
    }

    return NextResponse.json({
      success: true,
      data: sendResult,
      message: `Batch sent: ${sendResult.totalSent} emails delivered, ${sendResult.totalFailed} failed`,
    });
  } catch (error) {
    console.error('Send batch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
