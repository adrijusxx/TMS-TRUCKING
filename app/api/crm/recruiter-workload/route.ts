/**
 * GET /api/crm/recruiter-workload — Recruiter workload data (active leads, overdue follow-ups)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = session.user.companyId;
        const now = new Date();

        // Get all active recruiters with profiles
        const profiles = await prisma.recruiterProfile.findMany({
            where: { companyId, isActive: true },
            select: {
                userId: true,
                maxCapacity: true,
                user: { select: { firstName: true, lastName: true } },
            },
        });

        if (profiles.length === 0) {
            return NextResponse.json({ recruiters: [] });
        }

        const userIds = profiles.map((p) => p.userId);

        // Count active leads per recruiter (not HIRED/REJECTED)
        const activeCounts = await prisma.lead.groupBy({
            by: ['assignedToId'],
            where: {
                companyId, deletedAt: null,
                assignedToId: { in: userIds },
                status: { notIn: ['HIRED', 'REJECTED'] },
            },
            _count: { id: true },
        });
        const activeMap = Object.fromEntries(activeCounts.map((c) => [c.assignedToId!, c._count.id]));

        // Count overdue follow-ups per recruiter
        const overdueCounts = await prisma.lead.groupBy({
            by: ['assignedToId'],
            where: {
                companyId, deletedAt: null,
                assignedToId: { in: userIds },
                nextFollowUpDate: { lt: now },
                status: { notIn: ['HIRED', 'REJECTED'] },
            },
            _count: { id: true },
        });
        const overdueMap = Object.fromEntries(overdueCounts.map((c) => [c.assignedToId!, c._count.id]));

        const recruiters = profiles.map((p) => ({
            name: `${p.user.firstName} ${p.user.lastName}`,
            activeLeads: activeMap[p.userId] || 0,
            overdueFollowUps: overdueMap[p.userId] || 0,
            maxCapacity: p.maxCapacity,
        })).sort((a, b) => b.activeLeads - a.activeLeads);

        return NextResponse.json({ recruiters });
    } catch (error) {
        console.error('[CRM Recruiter Workload] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch workload' }, { status: 500 });
    }
}
