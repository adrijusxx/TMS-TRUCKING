import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { ConversationKnowledgeManager } from '@/lib/managers/ConversationKnowledgeManager';
import { prisma } from '@/lib/prisma';

/**
 * AI Sync API
 * Triggers the "Daily Learn" process for the AI
 * POST /api/admin/system/ai/sync
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // We can sync for a specific company or all companies
        const { companyId, days } = await req.json().catch(() => ({}));

        const results: any[] = [];

        if (companyId) {
            const manager = new ConversationKnowledgeManager(companyId);
            const count = await manager.syncConversationsToKB(days || 1);
            results.push({ companyId, ingested: count });
        } else {
            // Sync all active companies
            const companies = await prisma.company.findMany({
                where: { isActive: true, deletedAt: null },
                select: { id: true, name: true }
            });

            for (const company of companies) {
                const manager = new ConversationKnowledgeManager(company.id);
                const count = await manager.syncConversationsToKB(days || 1);
                results.push({ companyId: company.id, name: company.name, ingested: count });
            }
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            results
        });

    } catch (error: any) {
        console.error('[AI-Sync-API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
