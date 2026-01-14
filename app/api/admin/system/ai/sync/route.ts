import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { ConversationKnowledgeManager } from '@/lib/managers/ConversationKnowledgeManager';

/**
 * AI Sync API
 * Triggers Telegram conversation sync to Knowledge Base
 * POST /api/admin/system/ai/sync
 * 
 * NOTE: Telegram is a global connection (not per-company), so we only sync once using the user's primary company.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { days } = await req.json().catch(() => ({}));

        // Use the user's primary company for KB storage
        const companyId = session.user.companyId;

        if (!companyId) {
            return NextResponse.json({ error: 'No company found for user' }, { status: 400 });
        }

        console.log(`[AI-Sync] Starting Telegram sync for company ${companyId}`);

        const manager = new ConversationKnowledgeManager(companyId);
        const count = await manager.syncConversationsToKB(days || 7);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            ingestedCount: count,
            companyId
        });

    } catch (error: any) {
        console.error('[AI-Sync-API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
