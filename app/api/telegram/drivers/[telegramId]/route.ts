import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/telegram/drivers/[telegramId]
 * Unlink a driver from a Telegram chat (sets driverId to null, keeps the mapping)
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ telegramId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { telegramId } = await params;

        const existing = await prisma.telegramDriverMapping.findUnique({
            where: { telegramId },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Mapping not found' }, { status: 404 });
        }

        // Clear the driver link but keep the mapping record (for AI toggle state etc.)
        await prisma.telegramDriverMapping.update({
            where: { telegramId },
            data: { driverId: null },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Error unlinking driver:', error);
        return NextResponse.json({ error: 'Failed to unlink driver' }, { status: 500 });
    }
}
