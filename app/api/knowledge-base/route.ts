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

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Verify ownership
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true },
        });

        const doc = await prisma.knowledgeBaseDocument.findUnique({
            where: { id },
        });

        if (!doc || doc.companyId !== user?.companyId) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Delete chunks and document
        await prisma.$transaction([
            prisma.documentChunk.deleteMany({
                where: { documentId: id }
            }),
            prisma.knowledgeBaseDocument.delete({
                where: { id }
            })
        ]);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[API] Error deleting document:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete document' },
            { status: 500 }
        );
    }
}
