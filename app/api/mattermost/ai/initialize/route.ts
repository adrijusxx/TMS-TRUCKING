import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMattermostService } from '@/lib/services/MattermostService';

/**
 * POST /api/mattermost/ai/initialize
 * Initialize AI processing for incoming Mattermost messages
 */
export async function POST() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = (session.user as any).companyId;

        const service = getMattermostService();
        await service.initializeAIProcessing(companyId);

        return NextResponse.json({
            success: true,
            message: 'AI processing initialized',
        });
    } catch (error: any) {
        console.error('[API] Error initializing AI processing:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to initialize AI processing' },
            { status: 500 }
        );
    }
}
