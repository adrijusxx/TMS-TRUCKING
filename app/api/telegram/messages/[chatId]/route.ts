import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getTelegramService } from '@/lib/services/TelegramService';

/**
 * GET /api/telegram/messages/[chatId]
 * Get messages from a specific chat
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { chatId } = await params;
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const telegramService = getTelegramService();
        const messages = await telegramService.getMessages(chatId, limit);

        return NextResponse.json({
            success: true,
            data: messages
        });
    } catch (error: any) {
        console.error('[API] Error fetching messages:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/telegram/messages/[chatId]
 * Send a message to a specific chat
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { chatId } = await params;
        const { text, replyTo } = await request.json();

        if (!text) {
            return NextResponse.json(
                { error: 'Message text is required' },
                { status: 400 }
            );
        }

        const telegramService = getTelegramService();
        const message = await telegramService.sendMessage(chatId, text, { replyTo });

        return NextResponse.json({
            success: true,
            data: {
                id: message.id,
                text: (message as any).message || text,
                date: new Date(),
                out: true,
            }
        });
    } catch (error: any) {
        console.error('[API] Error sending message:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send message' },
            { status: 500 }
        );
    }
}
