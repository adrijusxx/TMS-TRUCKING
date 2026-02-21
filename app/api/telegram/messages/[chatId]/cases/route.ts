import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/telegram/messages/[chatId]/cases
 * Get breakdown cases linked to messages in this Telegram chat
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true },
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        const { chatId } = await params;

        const linkedCommunications = await prisma.communication.findMany({
            where: {
                telegramChatId: chatId,
                breakdownId: { not: null },
                companyId: user.companyId,
            },
            select: {
                telegramMessageId: true,
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

        // Build a map of telegramMessageId → breakdown info
        const casesMap: Record<string, {
            id: string;
            breakdownNumber: string;
            status: string;
            priority: string;
            breakdownType: string;
        }> = {};

        for (const comm of linkedCommunications) {
            if (comm.telegramMessageId && comm.breakdown) {
                casesMap[comm.telegramMessageId.toString()] = {
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
