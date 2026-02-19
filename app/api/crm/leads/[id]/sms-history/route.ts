import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/crm/leads/[id]/sms-history — SMS conversation for the messenger
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify lead access
        const lead = await prisma.lead.findFirst({
            where: { id, companyId: session.user.companyId, deletedAt: null },
            select: { id: true },
        });

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        const activities = await prisma.leadActivity.findMany({
            where: { leadId: id, type: 'SMS' },
            orderBy: { createdAt: 'asc' },
            include: {
                user: { select: { firstName: true, lastName: true } },
            },
        });

        return NextResponse.json({ data: activities });
    } catch (error) {
        console.error('[CRM SMS History] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch SMS history' }, { status: 500 });
    }
}
