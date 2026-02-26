import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { InvoiceDocumentBuilder } from '@/lib/managers/invoice/InvoiceDocumentBuilder';

export const dynamic = 'force-dynamic';

/**
 * GET /api/invoices/:id/package
 * Returns a merged PDF: Invoice + (optionally) Rate Confirmation + POD + BOL.
 * Query params: rateCon=true|false, pod=true|false, bol=true|false (all default true)
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
    const sp = request.nextUrl.searchParams;
    const options = {
      includeRateCon: sp.get('rateCon') !== 'false',
      includePod: sp.get('pod') !== 'false',
      includeBol: sp.get('bol') !== 'false',
    };

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

    // Build the merged PDF package with selected document types
    const pkg = await InvoiceDocumentBuilder.buildPackage(invoiceId, session.user.companyId, options);

    return new NextResponse(Buffer.from(pkg.buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${pkg.filename}"`,
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
