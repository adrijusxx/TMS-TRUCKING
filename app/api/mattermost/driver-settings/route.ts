import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/mattermost/driver-settings
 * Get per-driver AI auto-reply setting
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const mattermostUserId = searchParams.get('mattermostUserId');

        if (!mattermostUserId) {
            return NextResponse.json({ error: 'mattermostUserId required' }, { status: 400 });
        }

        const mapping = await prisma.mattermostDriverMapping.findUnique({
            where: { mattermostUserId },
            select: { aiAutoReply: true },
        });

        return NextResponse.json({ aiAutoReply: mapping?.aiAutoReply ?? false });
    } catch (error: any) {
        console.error('[API] Error fetching driver settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * POST /api/mattermost/driver-settings
 * Toggle per-driver AI auto-reply
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { mattermostUserId, aiAutoReply } = body;

        if (!mattermostUserId) {
            return NextResponse.json({ error: 'mattermostUserId required' }, { status: 400 });
        }

        const updatedMapping = await prisma.mattermostDriverMapping.upsert({
            where: { mattermostUserId },
            create: { mattermostUserId, aiAutoReply },
            update: { aiAutoReply },
        });

        return NextResponse.json({ success: true, aiAutoReply: updatedMapping.aiAutoReply });
    } catch (error: any) {
        console.error('[API] Error updating driver settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
