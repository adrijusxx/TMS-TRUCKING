import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

// GET /api/crm/dashboard - Aggregated recruiting dashboard data
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const mcWhere = await buildMcNumberWhereClause(session, request);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Run all queries in parallel
        const [
            totalLeads,
            openLeads,
            hiredThisMonth,
            pipelineRaw,
            sourceRaw,
            recentLeads,
            hiredLeadsForVelocity,
        ] = await Promise.all([
            // Total leads (non-deleted)
            prisma.lead.count({
                where: { ...mcWhere, deletedAt: null },
            }),

            // Open leads (not HIRED or REJECTED)
            prisma.lead.count({
                where: {
                    ...mcWhere,
                    deletedAt: null,
                    status: { notIn: ['HIRED', 'REJECTED'] },
                },
            }),

            // Hired this month
            prisma.lead.count({
                where: {
                    ...mcWhere,
                    deletedAt: null,
                    status: 'HIRED',
                    updatedAt: { gte: startOfMonth },
                },
            }),

            // Pipeline breakdown by status
            prisma.lead.groupBy({
                by: ['status'],
                where: { ...mcWhere, deletedAt: null },
                _count: { id: true },
            }),

            // Source breakdown
            prisma.lead.groupBy({
                by: ['source'],
                where: { ...mcWhere, deletedAt: null },
                _count: { id: true },
            }),

            // Recent 5 leads
            prisma.lead.findMany({
                where: { ...mcWhere, deletedAt: null },
                include: {
                    assignedTo: { select: { firstName: true, lastName: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),

            // Hired leads in last 30 days (for velocity)
            prisma.lead.findMany({
                where: {
                    ...mcWhere,
                    deletedAt: null,
                    status: 'HIRED',
                    updatedAt: { gte: thirtyDaysAgo },
                },
                select: { updatedAt: true },
                orderBy: { updatedAt: 'desc' },
            }),
        ]);

        // Calculate avg time-to-hire from recent hired leads
        let avgTimeToHire = 0;
        if (hiredLeadsForVelocity.length > 0) {
            // For a more accurate calculation, we'd check LeadActivity STATUS_CHANGE events
            // For now, approximate using createdAt to updatedAt (when HIRED status was set)
            const hiredWithCreation = await prisma.lead.findMany({
                where: {
                    ...mcWhere,
                    deletedAt: null,
                    status: 'HIRED',
                    updatedAt: { gte: thirtyDaysAgo },
                },
                select: { createdAt: true, updatedAt: true },
            });

            if (hiredWithCreation.length > 0) {
                const totalDays = hiredWithCreation.reduce((sum, lead) => {
                    const days = (lead.updatedAt.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24);
                    return sum + Math.max(0, days);
                }, 0);
                avgTimeToHire = Math.round(totalDays / hiredWithCreation.length);
            }
        }

        // Format pipeline data
        const statusOrder = [
            'NEW', 'CONTACTED', 'QUALIFIED', 'DOCUMENTS_PENDING',
            'DOCUMENTS_COLLECTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED',
        ];
        const pipeline = statusOrder.map((status) => {
            const found = pipelineRaw.find((p) => p.status === status);
            const count = found?._count?.id ?? 0;
            return {
                status,
                count,
                percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
            };
        });

        // Format source data
        const sourceBreakdown = sourceRaw.map((s) => ({
            source: s.source,
            count: s._count?.id ?? 0,
        }));

        // Hiring velocity: group by week
        const weeklyHires: Record<string, number> = {};
        for (const lead of hiredLeadsForVelocity) {
            const weekStart = new Date(lead.updatedAt);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const key = weekStart.toISOString().split('T')[0];
            weeklyHires[key] = (weeklyHires[key] || 0) + 1;
        }
        const hiringVelocity = Object.entries(weeklyHires)
            .map(([week, hires]) => ({ week, hires }))
            .sort((a, b) => a.week.localeCompare(b.week));

        return NextResponse.json({
            stats: {
                totalLeads,
                openLeads,
                hiredThisMonth,
                avgTimeToHire,
            },
            pipeline,
            sourceBreakdown,
            hiringVelocity,
            recentLeads,
        });
    } catch (error) {
        console.error('[CRM Dashboard GET] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recruiting dashboard data' },
            { status: 500 }
        );
    }
}
