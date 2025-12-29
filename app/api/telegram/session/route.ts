import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTelegramService } from '@/lib/services/TelegramService';

/**
 * GET /api/telegram/session
 * Get Telegram connection status
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const telegramService = getTelegramService();
        const status = await telegramService.getConnectionStatus();

        return NextResponse.json({ data: status });
    } catch (error: any) {
        console.error('[API] Error fetching Telegram status:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch status' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/telegram/session
 * Start Telegram authentication with phone number
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        if ((session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { phoneNumber } = await request.json();

        if (!phoneNumber) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            );
        }

        const telegramService = getTelegramService();
        const result = await telegramService.startAuth(phoneNumber);

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error('[API] Error starting Telegram auth:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to start authentication' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/telegram/session
 * Disconnect Telegram
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        if ((session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const telegramService = getTelegramService();
        await telegramService.disconnect();

        return NextResponse.json({
            success: true,
            message: 'Disconnected successfully',
        });
    } catch (error: any) {
        console.error('[API] Error disconnecting Telegram:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to disconnect' },
            { status: 500 }
        );
    }
}
