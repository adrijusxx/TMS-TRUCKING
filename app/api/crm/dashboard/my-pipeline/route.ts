import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/crm/dashboard/my-pipeline — Recruiter-scoped pipeline data
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const companyId = session.user.companyId;

        // Count leads by status assigned to this user
        const pipeline = await prisma.lead.groupBy({
            by: ['status'],
            where: {
                companyId,
                assignedToId: userId,
                deletedAt: null,
                status: { notIn: ['HIRED', 'REJECTED'] },
            },
            _count: true,
        });

        // Overdue follow-ups
        const overdueFollowUps = await prisma.lead.count({
            where: {
                companyId,
                assignedToId: userId,
                deletedAt: null,
                nextFollowUpDate: { lt: new Date() },
                status: { notIn: ['HIRED', 'REJECTED'] },
            },
        });

        // Today's follow-ups
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todayFollowUps = await prisma.lead.findMany({
            where: {
                companyId,
                assignedToId: userId,
                deletedAt: null,
                nextFollowUpDate: { gte: startOfDay, lte: endOfDay },
                status: { notIn: ['HIRED', 'REJECTED'] },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                status: true,
                nextFollowUpDate: true,
                nextFollowUpNote: true,
            },
            orderBy: { nextFollowUpDate: 'asc' },
            take: 10,
        });

        // My recent activity count (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentActivityCount = await prisma.leadActivity.count({
            where: {
                userId,
                createdAt: { gte: weekAgo },
                lead: { companyId },
            },
        });

        // My hires this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const myHiresThisMonth = await prisma.leadActivity.count({
            where: {
                userId,
                type: 'HIRED',
                createdAt: { gte: startOfMonth },
                lead: { companyId },
            },
        });

        return NextResponse.json({
            pipeline: pipeline.map((p) => ({ status: p.status, count: p._count })),
            overdueFollowUps,
            todayFollowUps,
            recentActivityCount,
            myHiresThisMonth,
            totalAssigned: pipeline.reduce((sum, p) => sum + p._count, 0),
        });
    } catch (error) {
        console.error('[CRM My Pipeline] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch pipeline' }, { status: 500 });
    }
}
