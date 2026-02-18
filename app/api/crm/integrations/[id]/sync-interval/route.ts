import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// PATCH /api/crm/integrations/[id]/sync-interval — Update auto-sync interval
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { syncInterval } = body; // null = manual only, 15/30/60 = minutes

        const integration = await prisma.crmIntegration.update({
            where: { id },
            data: { syncInterval: syncInterval ?? null },
        });

        return NextResponse.json({ integration });
    } catch (error) {
        console.error('[CRM Sync Interval PATCH] Error:', error);
        return NextResponse.json({ error: 'Failed to update sync interval' }, { status: 500 });
    }
}
