import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UsageManager } from '@/lib/managers/UsageManager';

/**
 * GET /api/usage/summary
 * Get usage summary for the current company
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.companyId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const summary = await UsageManager.getUsageSummary(session.user.companyId);

        if (!summary) {
            return NextResponse.json(
                { error: 'No subscription found' },
                { status: 404 }
            );
        }

        return NextResponse.json(summary);
    } catch (error) {
        console.error('[UsageAPI] Error fetching usage summary:', error);
        return NextResponse.json(
            { error: 'Failed to fetch usage summary' },
            { status: 500 }
        );
    }
}
