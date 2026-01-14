import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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

        // Upsert the mapping (create if not exists, update if exists)
        // We no longer require a driver link to enable AI.
        const updatedMapping = await prisma.telegramDriverMapping.upsert({
            where: { telegramId },
            create: {
                telegramId,
                aiAutoReply,
                // driverId remains null if not linked
            },
            update: {
                aiAutoReply,
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

        const mapping = await prisma.telegramDriverMapping.findUnique({
            where: { telegramId },
            select: {
                driver: {
                    select: { aiAutoReply: true }
                }
            }
        });

        if (!mapping || !mapping.driver) {
            // Default to false if not found
            return NextResponse.json({ aiAutoReply: false });
        }

        return NextResponse.json({ aiAutoReply: mapping.driver.aiAutoReply });

    } catch (error: any) {
        console.error('[API] Error fetching settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
