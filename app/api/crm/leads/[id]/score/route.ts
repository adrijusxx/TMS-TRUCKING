import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { prisma } from '@/lib/prisma';
import { LeadScoringService } from '@/lib/services/crm/LeadScoringService';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        // Verify access using MC filter
        const mcWhere = await buildMcNumberWhereClause(request, session);
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                ...mcWhere
            }
        });

        if (!lead) return NextResponse.json({ error: 'Lead not found or access denied' }, { status: 404 });

        // Calculate Score
        const scoringService = new LeadScoringService();
        const score = await scoringService.scoreLead(id);

        return NextResponse.json({ data: score });

    } catch (error: any) {
        console.error('Error calculating AI score:', error);
        return NextResponse.json({ error: error.message || 'Failed to calculate score' }, { status: 500 });
    }
}
