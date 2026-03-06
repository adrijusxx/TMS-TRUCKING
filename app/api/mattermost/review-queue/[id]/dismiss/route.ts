import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/mattermost/review-queue/[id]/dismiss
 * Dismiss a review item with optional note
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const companyId = (session.user as any).companyId;
        const userId = (session.user as any).id;
        const body = await request.json();
        const { note } = body;

        const item = await prisma.messagingReviewItem.findUnique({ where: { id } });
        if (!item || item.companyId !== companyId) {
            return NextResponse.json({ error: 'Review item not found' }, { status: 404 });
        }
        if (item.status !== 'PENDING') {
            return NextResponse.json({ error: 'Item already resolved' }, { status: 400 });
        }

        const updated = await prisma.messagingReviewItem.update({
            where: { id },
            data: {
                status: 'DISMISSED',
                resolvedAt: new Date(),
                resolvedById: userId,
                resolvedNote: note,
            },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error('[API] Error dismissing review item:', error);
        return NextResponse.json({ error: 'Failed to dismiss' }, { status: 500 });
    }
}
