import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Check if it exists
        const key = await prisma.apiKeyConfig.findUnique({
            where: { id },
        });

        if (!key) {
            return NextResponse.json({ error: 'API Key not found' }, { status: 404 });
        }

        // Hard delete
        await prisma.apiKeyConfig.delete({
            where: { id },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'DELETE_API_KEY',
                entityType: 'ApiKeyConfig',
                entityId: id,
                metadata: {
                    provider: key.provider,
                    configKey: key.configKey,
                    scope: key.scope
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting API key:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
