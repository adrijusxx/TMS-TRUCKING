import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTelegramService } from '@/lib/services/TelegramService';
import { resolveTelegramScope } from '@/lib/services/telegram/TelegramScopeResolver';

/**
 * POST /api/telegram/ai/initialize
 * Initialize AI processing for incoming messages
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user as any;
        if (!user.companyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        const scope = await resolveTelegramScope(user.companyId, user.mcNumberId);
        const telegramService = getTelegramService(scope);
        await telegramService.initializeAIProcessing(scope.companyId, scope.mcNumberId);

        return NextResponse.json({ success: true, message: 'AI processing initialized' });
    } catch (error: any) {
        console.error('[API] Error initializing AI processing:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to initialize AI processing' },
            { status: 500 }
        );
    }
}
