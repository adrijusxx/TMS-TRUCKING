import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getTelegramService } from '@/lib/services/TelegramService';
import { prisma } from '@/lib/prisma';

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

        // Get user's company
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true },
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        const telegramService = getTelegramService();
        await telegramService.initializeAIProcessing(user.companyId);

        return NextResponse.json({
            success: true,
            message: 'AI processing initialized'
        });
    } catch (error: any) {
        console.error('[API] Error initializing AI processing:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to initialize AI processing' },
            { status: 500 }
        );
    }
}
