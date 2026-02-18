import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

// GET /api/crm/reports?type=source|funnel|time-in-stage|recruiter
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'source';
        const mcWhere = await buildMcNumberWhereClause(session, request);
        const companyId = session.user.companyId;

        switch (type) {
            case 'source': {
                const leads = await prisma.lead.groupBy({
                    by: ['source'],
                    where: { ...mcWhere, companyId, deletedAt: null },
                    _count: { id: true },
                });
                const hired = await prisma.lead.groupBy({
                    by: ['source'],
                    where: { ...mcWhere, companyId, deletedAt: null, status: 'HIRED' },
                    _count: { id: true },
                });
                const hiredMap = Object.fromEntries(hired.map((h) => [h.source, h._count.id]));
                const data = leads.map((l) => ({
                    source: l.source,
                    total: l._count.id,
                    hired: hiredMap[l.source] || 0,
                    conversionRate: l._count.id > 0
                        ? Math.round(((hiredMap[l.source] || 0) / l._count.id) * 100)
                        : 0,
                }));
                return NextResponse.json({ data });
            }

            case 'funnel': {
                const pipeline = await prisma.lead.groupBy({
                    by: ['status'],
                    where: { ...mcWhere, companyId, deletedAt: null },
                    _count: { id: true },
                });
                const statusOrder = ['NEW', 'CONTACTED', 'QUALIFIED', 'DOCUMENTS_PENDING', 'DOCUMENTS_COLLECTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
                const data = statusOrder.map((status) => {
                    const entry = pipeline.find((p) => p.status === status);
                    return { status, count: entry?._count.id || 0 };
                });
                const total = data.reduce((sum, d) => sum + d.count, 0);
                const withRate = data.map((d) => ({
                    ...d,
                    percentage: total > 0 ? Math.round((d.count / total) * 100) : 0,
                }));
                return NextResponse.json({ data: withRate, total });
            }

            case 'time-in-stage': {
                // Calculate avg time leads spend in each status using activities
                const activities = await prisma.leadActivity.findMany({
                    where: {
                        type: 'STATUS_CHANGE',
                        lead: { ...mcWhere, companyId, deletedAt: null },
                    },
                    select: { leadId: true, createdAt: true, metadata: true },
                    orderBy: { createdAt: 'asc' },
                });

                const stageData: Record<string, { totalDays: number; count: number }> = {};
                const leadTimestamps: Record<string, Date> = {};

                for (const activity of activities) {
                    const meta = activity.metadata as any;
                    const newStatus = meta?.newStatus;
                    const prevTimestamp = leadTimestamps[activity.leadId];

                    if (prevTimestamp && newStatus) {
                        const days = (activity.createdAt.getTime() - prevTimestamp.getTime()) / (1000 * 60 * 60 * 24);
                        if (!stageData[newStatus]) stageData[newStatus] = { totalDays: 0, count: 0 };
                        stageData[newStatus].totalDays += days;
                        stageData[newStatus].count++;
                    }
                    leadTimestamps[activity.leadId] = activity.createdAt;
                }

                const data = Object.entries(stageData).map(([status, { totalDays, count }]) => ({
                    status,
                    avgDays: count > 0 ? Math.round((totalDays / count) * 10) / 10 : 0,
                    transitions: count,
                }));
                return NextResponse.json({ data });
            }

            case 'recruiter': {
                const recruiters = await prisma.lead.groupBy({
                    by: ['assignedToId'],
                    where: { ...mcWhere, companyId, deletedAt: null, assignedToId: { not: null } },
                    _count: { id: true },
                });
                const hiredByRecruiter = await prisma.lead.groupBy({
                    by: ['assignedToId'],
                    where: { ...mcWhere, companyId, deletedAt: null, status: 'HIRED', assignedToId: { not: null } },
                    _count: { id: true },
                });
                const hiredMap = Object.fromEntries(hiredByRecruiter.map((h) => [h.assignedToId!, h._count.id]));

                const recruiterIds = recruiters.map((r) => r.assignedToId!).filter(Boolean);
                const users = await prisma.user.findMany({
                    where: { id: { in: recruiterIds } },
                    select: { id: true, firstName: true, lastName: true },
                });
                const userMap = Object.fromEntries(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));

                const data = recruiters.map((r) => ({
                    recruiterId: r.assignedToId,
                    name: userMap[r.assignedToId!] || 'Unknown',
                    totalLeads: r._count.id,
                    hired: hiredMap[r.assignedToId!] || 0,
                    conversionRate: r._count.id > 0
                        ? Math.round(((hiredMap[r.assignedToId!] || 0) / r._count.id) * 100)
                        : 0,
                })).sort((a, b) => b.hired - a.hired);

                return NextResponse.json({ data });
            }

            default:
                return NextResponse.json({ error: `Unknown report type: ${type}` }, { status: 400 });
        }
    } catch (error) {
        console.error('[CRM Reports GET] Error:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
