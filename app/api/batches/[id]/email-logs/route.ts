import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/batches/:id/email-logs
 * Returns email send logs for a batch, showing per-invoice delivery status.
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

    const logs = await prisma.batchEmailLog.findMany({
      where: { invoiceBatchId: id },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Email logs fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
