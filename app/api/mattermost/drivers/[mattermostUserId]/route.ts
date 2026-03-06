import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/mattermost/drivers/[mattermostUserId]
 * Unlink a driver from a Mattermost user (sets driverId to null, keeps mapping)
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ mattermostUserId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { mattermostUserId } = await params;

        const existing = await prisma.mattermostDriverMapping.findUnique({
            where: { mattermostUserId },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Mapping not found' }, { status: 404 });
        }

        // Clear the driver link but keep the mapping record
        await prisma.mattermostDriverMapping.update({
            where: { mattermostUserId },
            data: { driverId: null },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Error unlinking driver:', error);
        return NextResponse.json({ error: 'Failed to unlink driver' }, { status: 500 });
    }
}
