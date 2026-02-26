import path from 'path';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { InvoiceDocumentBuilder } from '@/lib/managers/invoice/InvoiceDocumentBuilder';

export const dynamic = 'force-dynamic';

/**
 * GET /api/loads/:id/ratecon
 * Returns a Rate Confirmation PDF for a load.
 * Strategy 1: If a RateConfirmation record exists, generate PDF from template.
 * Strategy 2: Fall back to an uploaded RATE_CONFIRMATION document file.
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

    const { id: loadId } = await params;

    // Verify the load belongs to this company
    const load = await prisma.load.findFirst({
      where: { id: loadId, companyId: session.user.companyId, deletedAt: null },
      select: { id: true, loadNumber: true },
    });

    if (!load) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Load not found' } },
        { status: 404 }
      );
    }

    // Strategy 1: generate PDF from RateConfirmation record
    const buffer = await InvoiceDocumentBuilder.generateRateConPdf(loadId, session.user.companyId);
    if (buffer) {
      return new NextResponse(Buffer.from(buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="ratecon-${load.loadNumber}.pdf"`,
        },
      });
    }

    // Strategy 2: return uploaded RATE_CONFIRMATION document file
    const doc = await prisma.document.findFirst({
      where: { loadId, type: 'RATE_CONFIRMATION', deletedAt: null },
      select: { fileUrl: true, fileName: true, mimeType: true },
    });

    if (!doc) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No rate confirmation found for this load' } },
        { status: 404 }
      );
    }

    const filePath = path.join(process.cwd(), 'public', doc.fileUrl);
    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': doc.mimeType || 'application/pdf',
        'Content-Disposition': `attachment; filename="${doc.fileName || `ratecon-${load.loadNumber}.pdf`}"`,
      },
    });
  } catch (error) {
    console.error('Rate con PDF generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate rate confirmation PDF',
        },
      },
      { status: 500 }
    );
  }
}
