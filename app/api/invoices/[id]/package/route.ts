import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { InvoiceDocumentBuilder } from '@/lib/managers/invoice/InvoiceDocumentBuilder';

export const dynamic = 'force-dynamic';

/**
 * GET /api/invoices/:id/package
 * Returns a merged PDF containing Invoice + Rate Confirmation + POD + BOL.
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

    const { id: invoiceId } = await params;

    // Verify invoice belongs to company
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        customer: { companyId: session.user.companyId },
      },
      select: { id: true, invoiceNumber: true, loadIds: true },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } },
        { status: 404 }
      );
    }

    if (!invoice.loadIds || invoice.loadIds.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_LOADS', message: 'Invoice has no linked loads' } },
        { status: 400 }
      );
    }

    // Build the merged PDF package
    const pkg = await InvoiceDocumentBuilder.buildPackage(invoiceId, session.user.companyId);

    return new NextResponse(Buffer.from(pkg.buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pkg.filename}"`,
      },
    });
  } catch (error) {
    console.error('Invoice package generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate package',
        },
      },
      { status: 500 }
    );
  }
}
