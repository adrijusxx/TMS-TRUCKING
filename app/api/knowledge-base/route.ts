import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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

        const documents = await prisma.knowledgeBaseDocument.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                filename: true,
                fileType: true,
                fileSize: true,
                status: true,
                url: true,
                createdAt: true,
                metadata: true,
                _count: {
                    select: { chunks: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: documents
        });

    } catch (error: any) {
        console.error('[API] Error fetching documents:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch documents' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check for bulk delete via body
        let ids: string[] = [];
        try {
            const body = await request.json().catch(() => null);
            if (body && Array.isArray(body.ids)) {
                ids = body.ids;
            }
        } catch (e) {
            // No body or invalid json
        }

        // Fallback to query param
        if (ids.length === 0) {
            const { searchParams } = new URL(request.url);
            const id = searchParams.get('id');
            if (id) ids.push(id);
        }

        if (ids.length === 0) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Verify ownership
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true },
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        // Find docs to ensure they belong to company
        const docs = await prisma.knowledgeBaseDocument.findMany({
            where: {
                id: { in: ids },
                companyId: user.companyId
            },
            select: { id: true }
        });

        const validIds = docs.map(d => d.id);

        if (validIds.length === 0) {
            return NextResponse.json({ error: 'No valid documents found' }, { status: 404 });
        }

        // Delete chunks and documents
        await prisma.$transaction([
            prisma.documentChunk.deleteMany({
                where: { documentId: { in: validIds } }
            }),
            prisma.knowledgeBaseDocument.deleteMany({
                where: { id: { in: validIds } }
            })
        ]);

        return NextResponse.json({ success: true, count: validIds.length });

    } catch (error: any) {
        console.error('[API] Error deleting document:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete document' },
            { status: 500 }
        );
    }
}
