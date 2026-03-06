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
            // Try bot's own teams first
            const myTeamsRes = await fetch(`${cleanUrl}/api/v4/users/me/teams`, { headers });
            if (myTeamsRes.ok) {
                const myTeams = await myTeamsRes.json();
                if (Array.isArray(myTeams) && myTeams.length > 0) {
                    teamId = myTeams[0].id;
                }
            }
            // Fall back to listing all teams (works if bot has admin/system_admin role)
            if (!teamId) {
                const allTeamsRes = await fetch(`${cleanUrl}/api/v4/teams`, { headers });
                if (allTeamsRes.ok) {
                    const allTeams = await allTeamsRes.json();
                    if (Array.isArray(allTeams) && allTeams.length > 0) {
                        teamId = allTeams[0].id;
                        // Add bot to this team so future calls work
                        const meRes = await fetch(`${cleanUrl}/api/v4/users/me`, { headers });
                        if (meRes.ok) {
                            const me = await meRes.json();
                            await fetch(`${cleanUrl}/api/v4/teams/${teamId}/members`, {
                                method: 'POST',
                                headers: { ...headers, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ team_id: teamId, user_id: me.id }),
                            });
                        }
                    }
                }
            }
            if (!teamId) {
                return NextResponse.json(
                    { error: 'No Mattermost teams found' },
                    { status: 400 }
                );
            }
            // Save for future calls
            await prisma.mattermostSettings.update({
                where: { companyId },
                data: { teamId },
            });
        }

        // Fetch public channels for this team
        const res = await fetch(`${cleanUrl}/api/v4/teams/${teamId}/channels`, { headers });
        if (!res.ok) {
            // If bot isn't on the team, try to join and retry
            if (res.status === 403) {
                const meRes = await fetch(`${cleanUrl}/api/v4/users/me`, { headers });
                if (meRes.ok) {
                    const me = await meRes.json();
                    await fetch(`${cleanUrl}/api/v4/teams/${teamId}/members`, {
                        method: 'POST',
                        headers: { ...headers, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ team_id: teamId, user_id: me.id }),
                    });
                    // Retry
                    const retryRes = await fetch(`${cleanUrl}/api/v4/teams/${teamId}/channels`, { headers });
                    if (retryRes.ok) {
                        const channels = await retryRes.json();
                        return NextResponse.json({ success: true, data: channels });
                    }
                }
            }
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
