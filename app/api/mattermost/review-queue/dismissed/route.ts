import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/mattermost/review-queue/dismissed
 * Hard-delete all DISMISSED review items for the company (admin only)
 */
export async function DELETE() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user as any;
        if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const result = await prisma.messagingReviewItem.deleteMany({
            where: { companyId: user.companyId, platform: 'MATTERMOST', status: 'DISMISSED' },
        });

        return NextResponse.json({ success: true, data: { deleted: result.count } });
    } catch (error) {
        console.error('[API] Error deleting dismissed review items:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
