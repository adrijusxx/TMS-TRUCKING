import { NextRequest, NextResponse } from 'next/server';
import { withAuth, successResponse } from '@/lib/api/route-helpers';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';

/**
 * GET /api/knowledge-base/[id]
 * Fetches the full content of a KB document (concatenating its chunks)
 */
export const GET = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const doc = await prisma.knowledgeBaseDocument.findUnique({
    where: { id },
    include: {
      chunks: {
        orderBy: { chunkIndex: 'asc' },
        select: { content: true },
      },
    },
  });

  if (!doc || doc.companyId !== session.user.companyId) {
    throw new NotFoundError('Document');
  }

  const fullContent = doc.chunks.map((c) => c.content).join('\n\n');

  return successResponse({
    ...doc,
    fullContent,
  });
});
