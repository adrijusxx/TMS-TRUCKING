/**
 * GET /api/crm/leads/follow-ups?month=YYYY-MM — Returns leads with follow-up dates for calendar view
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const monthParam = searchParams.get('month');
        const mcWhere = await buildMcNumberWhereClause(session, request);

        // Default to current month
        const now = new Date();
        const year = monthParam ? parseInt(monthParam.split('-')[0]) : now.getFullYear();
        const month = monthParam ? parseInt(monthParam.split('-')[1]) - 1 : now.getMonth();

        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59);

        const leads = await prisma.lead.findMany({
            where: {
                ...mcWhere,
                deletedAt: null,
                nextFollowUpDate: { gte: startDate, lte: endDate },
                status: { notIn: ['HIRED', 'REJECTED'] },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                status: true,
                priority: true,
                nextFollowUpDate: true,
                nextFollowUpNote: true,
                assignedTo: { select: { firstName: true, lastName: true } },
            },
            orderBy: { nextFollowUpDate: 'asc' },
        });

        return NextResponse.json({ leads });
    } catch (error) {
        console.error('[CRM Follow-ups GET] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 });
    }
}
