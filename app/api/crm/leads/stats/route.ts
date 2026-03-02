import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { getLeadFilter, createFilterContext } from '@/lib/filters/role-data-filter';
import { handleApiError } from '@/lib/api/route-helpers';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const mcWhere = await buildMcNumberWhereClause(session, request);
        const filterContext = createFilterContext(
            session.user.id,
            session.user.role,
            session.user.companyId
        );
        const leadWhere = await getLeadFilter(filterContext);

        const baseWhere = { ...mcWhere, ...leadWhere };

        const [total, unassigned, statusCounts, overdueFollowUps] = await Promise.all([
            prisma.lead.count({ where: baseWhere }),
            prisma.lead.count({ where: { ...baseWhere, assignedToId: null } }),
            prisma.lead.groupBy({
                by: ['status'],
                where: baseWhere,
                _count: { id: true },
            }),
            prisma.lead.count({
                where: {
                    ...baseWhere,
                    nextFollowUpDate: { lt: new Date() },
                    status: { notIn: ['HIRED', 'REJECTED'] },
                },
            }),
        ]);

        const byStatus: Record<string, number> = {};
        for (const row of statusCounts) {
            byStatus[row.status] = row._count.id;
        }

        return NextResponse.json({ total, unassigned, overdueFollowUps, byStatus });
    } catch (error) {
        return handleApiError(error);
    }
}
