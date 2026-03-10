import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveTelegramScope } from '@/lib/services/telegram/TelegramScopeResolver';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { telegramId, aiAutoReply } = body;

        if (!telegramId) {
            return NextResponse.json({ error: 'Telegram ID required' }, { status: 400 });
        }

        const user = session.user as any;
        const scope = await resolveTelegramScope(user.companyId, user.mcNumberId);

        const existing = await prisma.telegramDriverMapping.findFirst({
            where: { telegramId, companyId: scope.companyId, mcNumberId: scope.mcNumberId },
        });

        const updatedMapping = existing
            ? await prisma.telegramDriverMapping.update({
                where: { id: existing.id },
                data: { aiAutoReply },
            })
            : await prisma.telegramDriverMapping.create({
                data: {
                    telegramId, aiAutoReply,
                    companyId: scope.companyId, mcNumberId: scope.mcNumberId,
                },
            });

        return NextResponse.json({ success: true, aiAutoReply: updatedMapping.aiAutoReply });
    } catch (error: any) {
        console.error('[API] Error updating settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const telegramId = searchParams.get('telegramId');

        if (!telegramId) {
            return NextResponse.json({ error: 'Telegram ID required' }, { status: 400 });
        }

        const user = session.user as any;
        const scope = await resolveTelegramScope(user.companyId, user.mcNumberId);

        const mapping = await prisma.telegramDriverMapping.findFirst({
            where: { telegramId, companyId: scope.companyId, mcNumberId: scope.mcNumberId },
            select: { aiAutoReply: true },
        });

        return NextResponse.json({ aiAutoReply: mapping?.aiAutoReply ?? false });
    } catch (error: any) {
        console.error('[API] Error fetching settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
