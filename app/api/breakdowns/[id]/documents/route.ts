import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { DocumentType } from '@prisma/client';

/**
 * GET /api/breakdowns/[id]/documents
 * Get all documents for a breakdown, optionally filtered by type
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

    // Await params (Next.js 15+ requirement)
    const { id: breakdownId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const documents = await prisma.document.findMany({
      where: {
        breakdownId,
        breakdown: {
          companyId: session.user.companyId,
        },
        ...(type && Object.values(DocumentType).includes(type as DocumentType) && { 
          type: type as DocumentType 
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      // Note: uploadedBy is a String field, not a relation
    });

    return NextResponse.json({ success: true, data: { documents } });
  } catch (error: any) {
    console.error('Error fetching breakdown documents:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch breakdown documents',
        },
      },
      { status: 500 }
    );
  }
}

