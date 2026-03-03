import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/telegram/review-queue/[id]/ignore
 * Permanently ignore a contact from a review item.
 * Creates a TelegramIgnoredContact record and dismisses all pending items for that contact.
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

        const item = await prisma.telegramReviewItem.findUnique({ where: { id } });
        if (!item || item.companyId !== companyId) {
            return NextResponse.json({ error: 'Review item not found' }, { status: 404 });
        }

        // Create ignored contact record (upsert to handle duplicates)
        const ignored = await prisma.telegramIgnoredContact.upsert({
            where: { companyId_telegramChatId: { companyId, telegramChatId: item.telegramChatId } },
            create: {
                companyId,
                telegramChatId: item.telegramChatId,
                senderName: item.senderName || item.chatTitle || undefined,
                reason: reason || undefined,
                ignoredById: userId,
            },
            update: {
                reason: reason || undefined,
                ignoredById: userId,
            },
        });

        // Dismiss all PENDING review items for this contact
        await prisma.telegramReviewItem.updateMany({
            where: {
                companyId,
                telegramChatId: item.telegramChatId,
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
