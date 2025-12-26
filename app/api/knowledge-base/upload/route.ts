import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { KnowledgeBaseService } from '@/lib/services/KnowledgeBaseService';

export async function POST(request: NextRequest) {
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

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file type
        // Validate file type
        const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown'];
        const isMd = file.name.toLowerCase().endsWith('.md');

        if (!allowedTypes.includes(file.type) && !isMd) {
            return NextResponse.json({ error: 'Invalid file type. Only PDF, TXT, and Markdown files are supported.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const kbService = new KnowledgeBaseService(user.companyId);
        const docId = await kbService.processDocument(buffer, file.name, file.type);

        return NextResponse.json({
            success: true,
            data: { id: docId, message: 'Document processed successfully' }
        });

    } catch (error: any) {
        console.error('[API] Error uploading document:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to upload document' },
            { status: 500 }
        );
    }
}
