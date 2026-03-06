import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/mattermost/ignored-contacts/[id]
 * Un-ignore a contact — removes the MessagingIgnoredContact record
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const companyId = (session.user as any).companyId;

        const record = await prisma.messagingIgnoredContact.findUnique({ where: { id } });
        if (!record || record.companyId !== companyId) {
            return NextResponse.json({ error: 'Ignored contact not found' }, { status: 404 });
        }

        await prisma.messagingIgnoredContact.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Error un-ignoring contact:', error);
        return NextResponse.json({ error: 'Failed to un-ignore contact' }, { status: 500 });
    }
}
