import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { LeadScoringService } from '@/lib/services/crm/LeadScoringService';

// POST /api/crm/leads/[id]/summary — Generate or regenerate AI summary
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const lead = await prisma.lead.findFirst({
            where: { id, companyId: session.user.companyId, deletedAt: null },
        });

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        const service = new LeadScoringService();
        const summary = await service.generateSummary(id);

        return NextResponse.json({ summary });
    } catch (error: unknown) {
        console.error('[CRM Lead Summary] Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to generate summary';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
