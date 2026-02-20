import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { sendSMS } from '@/lib/integrations/netsapiens/sms';

// POST /api/crm/leads/[id]/send-sms — Send SMS to a lead via NetSapiens
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
        const { message, nextFollowUpDate, nextFollowUpNote } = body;

        if (!message?.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Verify lead exists and belongs to user's company
        const lead = await prisma.lead.findFirst({
            where: { id, companyId: session.user.companyId, deletedAt: null },
            select: { id: true, phone: true, firstName: true, lastName: true },
        });

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        if (!lead.phone) {
            return NextResponse.json({ error: 'Lead has no phone number' }, { status: 400 });
        }

        // Get user's PBX extension as "from" number
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { voipConfig: true },
        });

        const voipConfig = user?.voipConfig as Record<string, any> | null;
        const fromNumber = voipConfig?.pbxExtension || voipConfig?.username;

        if (!fromNumber) {
            return NextResponse.json(
                { error: 'No PBX extension configured. Go to Settings → VoIP to set up.' },
                { status: 400 }
            );
        }

        // Send SMS via NetSapiens
        const result = await sendSMS(fromNumber, lead.phone, message.trim(), session.user.companyId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to send SMS' },
                { status: 500 }
            );
        }

        // Log activity
        await prisma.leadActivity.create({
            data: {
                leadId: id,
                type: 'SMS',
                content: message.trim(),
                userId: session.user.id,
                metadata: { sent: true, to: lead.phone, from: fromNumber },
            },
        });

        // Update lead: lastContactedAt, lastSmsAt + optional follow-up
        const updateData: Record<string, any> = { lastContactedAt: new Date(), lastSmsAt: new Date() };
        if (nextFollowUpDate !== undefined) {
            updateData.nextFollowUpDate = nextFollowUpDate ? new Date(nextFollowUpDate) : null;
        }
        if (nextFollowUpNote !== undefined) {
            updateData.nextFollowUpNote = nextFollowUpNote;
        }

        await prisma.lead.update({ where: { id }, data: updateData });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error('[CRM Send SMS] Error:', error);
        return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
    }
}
