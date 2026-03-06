import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMattermostService } from '@/lib/services/MattermostService';

/**
 * POST /api/mattermost/actions
 * Handle interactive button callbacks from Mattermost.
 * This is called by Mattermost when a user clicks an action button.
 * NOTE: No auth check — this is called by Mattermost server, not by users.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { context, user_id: mmUserId, channel_id: channelId } = body;

        if (!context?.action) {
            return NextResponse.json({ error: 'No action specified' }, { status: 400 });
        }

        const action = context.action as string;
        const service = getMattermostService();

        // Find the driver mapping for this Mattermost user
        const mapping = await prisma.mattermostDriverMapping.findUnique({
            where: { mattermostUserId: mmUserId },
            include: {
                driver: {
                    include: {
                        user: { select: { firstName: true, lastName: true } },
                        currentTruck: { select: { truckNumber: true } },
                    },
                },
            },
        });

        // Route action to appropriate handler
        if (action === 'driver:current_load' && mapping?.driverId) {
            const load = await prisma.load.findFirst({
                where: { driverId: mapping.driverId, status: { in: ['DISPATCHED', 'IN_TRANSIT'] } },
                select: { loadNumber: true, status: true, origin: true, destination: true },
                orderBy: { createdAt: 'desc' },
            });

            const text = load
                ? `**Current Load: ${load.loadNumber}**\nStatus: ${load.status}\nOrigin: ${load.origin}\nDestination: ${load.destination}`
                : 'No active loads assigned.';

            await service.sendMessage(channelId, text);
        } else if (action === 'driver:breakdown' && mapping?.driverId) {
            await service.sendMessage(
                channelId,
                'Please describe the breakdown situation. Include your location and what happened.',
            );
        } else {
            await service.sendMessage(channelId, `Action received: ${action}`);
        }

        // Mattermost expects a 200 with update or empty object
        return NextResponse.json({ update: { props: {} } });
    } catch (error: any) {
        console.error('[API] Error handling Mattermost action:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to handle action' },
            { status: 500 }
        );
    }
}
