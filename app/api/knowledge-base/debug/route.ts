import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { KnowledgeBaseService } from '@/lib/services/KnowledgeBaseService';

/**
 * GET /api/knowledge-base/debug
 * Debug endpoint to check KB status and test search
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true },
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        // Get test query from params
        const { searchParams } = new URL(request.url);
        const testQuery = searchParams.get('q') || 'brake repair troubleshooting';

        // 1. Check documents and their status
        const documents = await prisma.knowledgeBaseDocument.findMany({
            where: { companyId: user.companyId },
            select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
                _count: {
                    select: { chunks: true }
                }
            }
        });

        // 2. Count total chunks with embeddings
        const totalChunks = await prisma.documentChunk.count({
            where: {
                document: {
                    companyId: user.companyId,
                    status: 'READY'
                }
            }
        });

        // 3. Test search if there are chunks
        let searchResults: any[] = [];
        let searchError: string | null = null;

        if (totalChunks > 0) {
            try {
                const kbService = new KnowledgeBaseService(user.companyId);
                searchResults = await kbService.search(testQuery, 3);
            } catch (err: any) {
                searchError = err.message;
            }
        }

        return NextResponse.json({
            success: true,
            companyId: user.companyId,
            stats: {
                totalDocuments: documents.length,
                readyDocuments: documents.filter(d => d.status === 'READY').length,
                totalChunks,
            },
            documents: documents.map(d => ({
                id: d.id,
                title: d.title,
                status: d.status,
                chunkCount: d._count.chunks,
                createdAt: d.createdAt,
            })),
            searchTest: {
                query: testQuery,
                resultsCount: searchResults.length,
                results: searchResults.map(r => ({
                    documentTitle: r.documentTitle,
                    score: r.score,
                    contentPreview: r.content?.substring(0, 150) + '...',
                })),
                error: searchError,
            }
        });

    } catch (error: any) {
        console.error('[API] KB Debug error:', error);
        return NextResponse.json(
            { error: error.message || 'Debug failed' },
            { status: 500 }
        );
    }
}
