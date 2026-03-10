import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTelegramService } from '@/lib/services/TelegramService';
import { resolveTelegramScope } from '@/lib/services/telegram/TelegramScopeResolver';

/**
 * POST /api/telegram/session/verify
 * Verify the Telegram authentication code
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

        const { code, phoneNumber } = await request.json();

        if (!code || !phoneNumber) {
            return NextResponse.json(
                { error: 'Code and phone number are required' },
                { status: 400 }
            );
        }

        const scope = await resolveTelegramScope((session.user as any).companyId, (session.user as any).mcNumberId);
        const telegramService = getTelegramService(scope);
        await telegramService.verifyCode(code, phoneNumber);

        return NextResponse.json({
            success: true,
            message: 'Telegram connected successfully',
        });
    } catch (error: any) {
        console.error('[API] Error verifying Telegram code:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to verify code' },
            { status: 500 }
        );
    }
}
