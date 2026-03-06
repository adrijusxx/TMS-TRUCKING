import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/mattermost/channels
 * List all channels from Mattermost (direct API call, no singleton dependency)
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

        const cleanUrl = settings.serverUrl.replace(/\/+$/, '');
        const headers = { Authorization: `Bearer ${settings.botToken}` };

        // Auto-detect teamId if not stored
        let teamId = settings.teamId;
        if (!teamId) {
            const teamsRes = await fetch(`${cleanUrl}/api/v4/users/me/teams`, { headers });
            if (teamsRes.ok) {
                const teams = await teamsRes.json();
                if (Array.isArray(teams) && teams.length > 0) {
                    teamId = teams[0].id;
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

        // Fetch channels directly from Mattermost API
        const res = await fetch(`${cleanUrl}/api/v4/teams/${teamId}/channels`, { headers });
        if (!res.ok) {
            const errorText = await res.text().catch(() => '');
            throw new Error(`Mattermost API error ${res.status}: ${errorText}`);
        }
        const channels = await res.json();

        return NextResponse.json({ success: true, data: channels });
    } catch (error: any) {
        console.error('[API] Error fetching channels:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch channels' },
            { status: 500 }
        );
    }
}
