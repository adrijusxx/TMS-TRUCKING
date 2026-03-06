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
            select: { teamId: true, serverUrl: true, botToken: true },
        });

        if (!settings?.serverUrl || !settings?.botToken) {
            return NextResponse.json(
                { error: 'Mattermost not connected' },
                { status: 400 }
            );
        }

        // Auto-detect teamId if not stored
        let teamId = settings.teamId;
        if (!teamId) {
            const cleanUrl = settings.serverUrl.replace(/\/+$/, '');
            const teamsRes = await fetch(`${cleanUrl}/api/v4/users/me/teams`, {
                headers: { Authorization: `Bearer ${settings.botToken}` },
            });
            if (teamsRes.ok) {
                const teams = await teamsRes.json();
                if (Array.isArray(teams) && teams.length > 0) {
                    teamId = teams[0].id;
                    // Save it for future calls
                    await prisma.mattermostSettings.update({
                        where: { companyId },
                        data: { teamId },
                    });
                }
            }
            if (!teamId) {
                return NextResponse.json(
                    { error: 'No Mattermost teams found for this bot' },
                    { status: 400 }
                );
            }
        }

        const queryService = getMattermostQueryService();
        const dialogs = await queryService.getDialogs(teamId);

        return NextResponse.json({ success: true, data: dialogs });
    } catch (error: any) {
        console.error('[API] Error fetching channels:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch channels' },
            { status: 500 }
        );
    }
}
