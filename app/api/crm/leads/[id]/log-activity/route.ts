import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST /api/crm/leads/[id]/log-activity — Log a CALL, SMS, or EMAIL activity
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
        const body = await request.json();
        const { type, content, duration, nextFollowUpDate, nextFollowUpNote } = body;

        if (!type || !['CALL', 'SMS', 'EMAIL'].includes(type)) {
            return NextResponse.json(
                { error: 'Type must be CALL, SMS, or EMAIL' },
                { status: 400 }
            );
        }

        // Verify lead exists and belongs to user's company
        const lead = await prisma.lead.findFirst({
            where: { id, companyId: session.user.companyId, deletedAt: null },
        });

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Create activity
        const activity = await prisma.leadActivity.create({
            data: {
                leadId: id,
                type,
                content: content || `${type} logged`,
                userId: session.user.id,
                metadata: duration ? { duration } : undefined,
            },
            include: {
                user: { select: { firstName: true, lastName: true } },
            },
        });

        // Update lead: set lastContactedAt, type-specific timestamp, and optionally follow-up
        const updateData: any = { lastContactedAt: new Date() };
        if (type === 'CALL') updateData.lastCallAt = new Date();
        if (type === 'SMS') updateData.lastSmsAt = new Date();
        if (nextFollowUpDate !== undefined) {
            updateData.nextFollowUpDate = nextFollowUpDate ? new Date(nextFollowUpDate) : null;
        }
        if (nextFollowUpNote !== undefined) {
            updateData.nextFollowUpNote = nextFollowUpNote;
        }

        await prisma.lead.update({ where: { id }, data: updateData });

        return NextResponse.json({ activity }, { status: 201 });
    } catch (error) {
        console.error('[CRM Log Activity POST] Error:', error);
        return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
    }
}
