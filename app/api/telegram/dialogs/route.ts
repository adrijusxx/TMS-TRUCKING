import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getTelegramService } from '@/lib/services/TelegramService';

/**
 * GET /api/telegram/dialogs
 * Get all Telegram conversations
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const telegramService = getTelegramService();

        // Auto-reconnect if we have a saved session
        const connected = await telegramService.autoConnect();
        if (!connected) {
            return NextResponse.json(
                { error: 'Telegram not connected', needsConnection: true },
                { status: 503 }
            );
        }

        const dialogs = await telegramService.getDialogs(limit);

        return NextResponse.json({
            success: true,
            data: dialogs
        });
    } catch (error: any) {
        console.error('[API] Error fetching dialogs:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch dialogs' },
            { status: 500 }
        );
    }
}
