import path from 'path';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/loads/:id/pod
 * Returns the Proof of Delivery document for a load.
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

    const doc = await prisma.document.findFirst({
      where: { loadId, type: 'POD', deletedAt: null },
      select: { fileUrl: true, fileName: true, mimeType: true },
    });

    if (!doc) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No POD found for this load' } },
        { status: 404 }
      );
    }

    const filePath = path.join(process.cwd(), 'public', doc.fileUrl);
    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': doc.mimeType || 'application/pdf',
        'Content-Disposition': `inline; filename="${doc.fileName || `pod-${load.loadNumber}.pdf`}"`,
      },
    });
  } catch (error) {
    console.error('POD serving error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to serve POD',
        },
      },
      { status: 500 }
    );
  }
}
