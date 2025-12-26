import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getTelegramService } from '@/lib/services/TelegramService';

/**
 * GET /api/telegram/media/[chatId]/[messageId]
 * Download and serve media from a Telegram message
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string; messageId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { chatId, messageId } = await params;

        const telegramService = getTelegramService();
        const buffer = await telegramService.downloadMedia(chatId, parseInt(messageId));

        // Return the media file
        return new NextResponse(buffer as any, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Cache-Control': 'public, max-age=31536000',
            },
        });
    } catch (error: any) {
        console.error('[API] Error downloading media:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to download media' },
            { status: 500 }
        );
    }
}
