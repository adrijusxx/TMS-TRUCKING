import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMattermostService } from '@/lib/services/MattermostService';
import { getMattermostQueryService } from '@/lib/services/MattermostQueryService';

/**
 * GET /api/mattermost/messages/[channelId]
 * Get messages from a specific channel
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ channelId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { channelId } = await params;
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const queryService = getMattermostQueryService();
        const messages = await queryService.getMessages(channelId, limit);

        return NextResponse.json({ success: true, data: messages });
    } catch (error: any) {
        console.error('[API] Error fetching messages:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/mattermost/messages/[channelId]
 * Send a message to a specific channel
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ channelId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { channelId } = await params;
        const { text, replyTo } = await request.json();

        if (!text) {
            return NextResponse.json(
                { error: 'Message text is required' },
                { status: 400 }
            );
        }

        const service = getMattermostService();
        const post = await service.sendMessage(channelId, text, { rootId: replyTo });

        return NextResponse.json({
            success: true,
            data: {
                id: post.id,
                text: post.message || text,
                date: new Date(),
                out: true,
            },
        });
    } catch (error: any) {
        console.error('[API] Error sending message:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send message' },
            { status: 500 }
        );
    }
}
