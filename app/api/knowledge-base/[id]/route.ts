import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/knowledge-base/[id]
 * Fetches the full content of a KB document (concatenating its chunks)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true },
        });

        const doc = await prisma.knowledgeBaseDocument.findUnique({
            where: { id },
            include: {
                chunks: {
                    orderBy: { chunkIndex: 'asc' },
                    select: { content: true }
                }
            }
        });

        if (!doc || doc.companyId !== user?.companyId) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        const fullContent = doc.chunks.map(c => c.content).join('\n\n');

        return NextResponse.json({
            success: true,
            data: {
                ...doc,
                fullContent
            }
        });

    } catch (error: any) {
        console.error('[API] Error fetching document content:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch document' },
            { status: 500 }
        );
    }
}
