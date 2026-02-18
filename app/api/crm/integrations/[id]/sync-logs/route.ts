import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/crm/integrations/[id]/sync-logs — Fetch sync log history
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const logs = await prisma.crmSyncLog.findMany({
            where: { integrationId: id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return NextResponse.json({ logs });
    } catch (error) {
        console.error('[CRM Sync Logs GET] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch sync logs' }, { status: 500 });
    }
}
