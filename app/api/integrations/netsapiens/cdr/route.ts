import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { getCDRs, getUserCDRs } from '@/lib/integrations/netsapiens';

/**
 * NetSapiens CDR (Call Detail Records) API
 * GET /api/integrations/netsapiens/cdr
 *
 * Query params:
 *   startDate  — ISO date (defaults to 7 days ago)
 *   endDate    — ISO date (defaults to now)
 *   user       — filter by extension
 *   direction  — inbound | outbound | internal
 *   limit      — max records (default 50)
 *   offset     — pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        if (!hasPermission(session.user.role as any, 'settings.view')) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const user = searchParams.get('user') || undefined;
        const direction = searchParams.get('direction') || undefined;
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        // Default to last 7 days
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startDate = searchParams.get('startDate') || weekAgo.toISOString();
        const endDate = searchParams.get('endDate') || now.toISOString();

        const params = { startDate, endDate, direction, limit, offset };
        const companyId = session.user.companyId;

        const result = user
            ? await getUserCDRs(user, params, companyId)
            : await getCDRs({ ...params, user }, companyId);

        return NextResponse.json({
            success: true,
            data: result.data,
            total: result.total,
            limit,
            offset,
        });
    } catch (error: any) {
        console.error('[NetSapiens CDR] Error:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
