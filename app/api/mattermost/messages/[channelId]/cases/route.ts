import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/mattermost/messages/[channelId]/cases
 * Get breakdown cases linked to messages in this channel
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

        const companyId = (session.user as any).companyId;
        const { channelId } = await params;

        const linkedCommunications = await prisma.communication.findMany({
            where: {
                mattermostChannelId: channelId,
                breakdownId: { not: null },
                companyId,
            },
            select: {
                mattermostPostId: true,
                breakdown: {
                    select: {
                        id: true,
                        breakdownNumber: true,
                        status: true,
                        priority: true,
                        breakdownType: true,
                    },
                },
            },
        });

        // Build a map of postId -> breakdown info
        const casesMap: Record<string, {
            id: string;
            breakdownNumber: string;
            status: string;
            priority: string;
            breakdownType: string;
        }> = {};

        for (const comm of linkedCommunications) {
            if (comm.mattermostPostId && comm.breakdown) {
                casesMap[comm.mattermostPostId] = {
                    id: comm.breakdown.id,
                    breakdownNumber: comm.breakdown.breakdownNumber,
                    status: comm.breakdown.status,
                    priority: comm.breakdown.priority,
                    breakdownType: comm.breakdown.breakdownType,
                };
            }
        }

        return NextResponse.json({ success: true, data: casesMap });
    } catch (error: any) {
        console.error('[API] Error fetching linked cases:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch linked cases' },
            { status: 500 }
        );
    }
}
