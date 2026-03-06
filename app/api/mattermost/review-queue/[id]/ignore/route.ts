import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/mattermost/review-queue/[id]/ignore
 * Permanently ignore a contact from a review item.
 * Creates a MessagingIgnoredContact record and dismisses all pending items for that contact.
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
        const { reason } = body;

        const item = await prisma.messagingReviewItem.findUnique({ where: { id } });
        if (!item || item.companyId !== companyId) {
            return NextResponse.json({ error: 'Review item not found' }, { status: 404 });
        }

        if (!item.externalChatId) {
            return NextResponse.json({ error: 'No external ID on this item' }, { status: 400 });
        }

        // Create ignored contact record (upsert to handle duplicates)
        const ignored = await prisma.messagingIgnoredContact.upsert({
            where: {
                companyId_platform_externalId: {
                    companyId,
                    platform: 'MATTERMOST',
                    externalId: item.externalChatId,
                },
            },
            create: {
                companyId,
                platform: 'MATTERMOST',
                externalId: item.externalChatId,
                senderName: item.senderName || item.channelName || undefined,
                reason: reason || undefined,
                ignoredById: userId,
            },
            update: {
                reason: reason || undefined,
                ignoredById: userId,
            },
        });

        // Dismiss all PENDING review items for this contact
        await prisma.messagingReviewItem.updateMany({
            where: {
                companyId,
                platform: 'MATTERMOST',
                externalChatId: item.externalChatId,
                status: 'PENDING',
            },
            data: {
                status: 'DISMISSED',
                resolvedAt: new Date(),
                resolvedById: userId,
                resolvedNote: 'Contact permanently ignored',
            },
        });

        return NextResponse.json({ success: true, data: ignored });
    } catch (error) {
        console.error('[API] Error ignoring contact:', error);
        return NextResponse.json({ error: 'Failed to ignore contact' }, { status: 500 });
    }
}
