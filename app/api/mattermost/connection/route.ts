import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMattermostService } from '@/lib/services/MattermostService';

/**
 * GET /api/mattermost/connection
 * Get Mattermost connection status
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const service = getMattermostService();
        const status = await service.getConnectionStatus();

        return NextResponse.json({ data: status });
    } catch (error: any) {
        console.error('[API] Error fetching Mattermost status:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch status' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/mattermost/connection
 * Connect to Mattermost with serverUrl + botToken
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = (session.user as any).companyId;
        const { serverUrl, botToken } = await request.json();

        if (!serverUrl || !botToken) {
            return NextResponse.json(
                { error: 'serverUrl and botToken are required' },
                { status: 400 }
            );
        }

        // Test connection first
        const service = getMattermostService();
        const testResult = await service.testConnection(serverUrl, botToken);

        if (!testResult.success) {
            return NextResponse.json(
                { error: testResult.error || 'Connection failed' },
                { status: 400 }
            );
        }

        // Auto-detect team ID and ensure bot is a team member
        let teamId: string | null = null;
        try {
            const cleanUrl = serverUrl.replace(/\/+$/, '');
            const authHeaders = { Authorization: `Bearer ${botToken}` };

            // Try bot's own teams first
            const myTeamsRes = await fetch(`${cleanUrl}/api/v4/users/me/teams`, { headers: authHeaders });
            if (myTeamsRes.ok) {
                const myTeams = await myTeamsRes.json();
                if (Array.isArray(myTeams) && myTeams.length > 0) {
                    teamId = myTeams[0].id;
                }
            }

            // Fall back to all teams and add bot to the first one
            if (!teamId) {
                const allTeamsRes = await fetch(`${cleanUrl}/api/v4/teams`, { headers: authHeaders });
                if (allTeamsRes.ok) {
                    const allTeams = await allTeamsRes.json();
                    if (Array.isArray(allTeams) && allTeams.length > 0) {
                        teamId = allTeams[0].id;
                        const meRes = await fetch(`${cleanUrl}/api/v4/users/me`, { headers: authHeaders });
                        if (meRes.ok) {
                            const me = await meRes.json();
                            await fetch(`${cleanUrl}/api/v4/teams/${teamId}/members`, {
                                method: 'POST',
                                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ team_id: teamId, user_id: me.id }),
                            });
                        }
                    }
                }
            }
        } catch {
            // Non-fatal — teamId will remain null
        }

        // Save settings
        await prisma.mattermostSettings.upsert({
            where: { companyId },
            create: {
                companyId,
                serverUrl,
                botToken,
                botUsername: testResult.botUsername || null,
                teamId,
                connectionError: null,
            },
            update: {
                serverUrl,
                botToken,
                botUsername: testResult.botUsername || null,
                teamId,
                connectionError: null,
            },
        });

        // Connect
        await service.connect({ serverUrl, botToken });

        return NextResponse.json({
            success: true,
            data: { botUsername: testResult.botUsername },
        });
    } catch (error: any) {
        console.error('[API] Error connecting to Mattermost:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to connect' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/mattermost/connection
 * Disconnect from Mattermost
 */
export async function DELETE() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const service = getMattermostService();
        await service.disconnect();

        return NextResponse.json({
            success: true,
            message: 'Disconnected successfully',
        });
    } catch (error: any) {
        console.error('[API] Error disconnecting Mattermost:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to disconnect' },
            { status: 500 }
        );
    }
}
