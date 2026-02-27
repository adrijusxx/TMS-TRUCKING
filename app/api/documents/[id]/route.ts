import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';

/**
 * GET /api/documents/[id]
 * Serve a document file (PDF, image, etc.)
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

    const { id: documentId } = await params;

    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      select: { fileUrl: true, fileName: true, mimeType: true },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } },
        { status: 404 }
      );
    }

    const filePath = join(process.cwd(), 'public', document.fileUrl);
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': document.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${document.fileName || 'document'}"`,
      },
    });
  } catch (error: any) {
    console.error('Error serving document:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to serve document' },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/[id]
 * Delete a document
 */
export async function DELETE(
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

    const { id: documentId } = await params;

    // Find document and verify ownership
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        companyId: session.user.companyId,
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    try {
      const filePath = join(process.cwd(), 'public', document.fileUrl);
      await unlink(filePath);
    } catch (error) {
      console.error('Error deleting file from filesystem:', error);
      // Continue even if file deletion fails
    }

    // Delete document record
    await prisma.document.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true, data: { message: 'Document deleted successfully' } });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to delete document',
        },
      },
      { status: 500 }
    );
  }
}
