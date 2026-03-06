import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMattermostQueryService } from '@/lib/services/MattermostQueryService';

/**
 * GET /api/mattermost/channels
 * List all channels (conversations) from Mattermost
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = (session.user as any).companyId;

        const settings = await prisma.mattermostSettings.findUnique({
            where: { companyId },
            select: { teamId: true },
        });

        if (!settings?.teamId) {
            return NextResponse.json(
                { error: 'Mattermost team not configured' },
                { status: 400 }
            );
        }

        const queryService = getMattermostQueryService();
        const dialogs = await queryService.getDialogs(settings.teamId);

        return NextResponse.json({ success: true, data: dialogs });
    } catch (error: any) {
        console.error('[API] Error fetching channels:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch channels' },
            { status: 500 }
        );
    }
}
