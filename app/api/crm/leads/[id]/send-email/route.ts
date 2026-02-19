import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/services/EmailService';

// POST /api/crm/leads/[id]/send-email — Send email to a lead via AWS SES
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
        const { subject, body: emailBody, nextFollowUpDate, nextFollowUpNote } = body;

        if (!subject?.trim()) {
            return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
        }
        if (!emailBody?.trim()) {
            return NextResponse.json({ error: 'Email body is required' }, { status: 400 });
        }

        // Verify lead exists and belongs to user's company
        const lead = await prisma.lead.findFirst({
            where: { id, companyId: session.user.companyId, deletedAt: null },
            select: { id: true, email: true, firstName: true, lastName: true },
        });

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        if (!lead.email) {
            return NextResponse.json({ error: 'Lead has no email address' }, { status: 400 });
        }

        // Send email via AWS SES
        const sent = await EmailService.sendEmail({
            to: lead.email,
            subject: subject.trim(),
            html: emailBody.trim(),
        });

        if (!sent) {
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }

        // Log activity
        await prisma.leadActivity.create({
            data: {
                leadId: id,
                type: 'EMAIL',
                content: `Subject: ${subject.trim()}\n\n${emailBody.trim()}`,
                userId: session.user.id,
                metadata: { sent: true, to: lead.email, subject: subject.trim() },
            },
        });

        // Update lead: lastContactedAt + optional follow-up
        const updateData: Record<string, any> = { lastContactedAt: new Date() };
        if (nextFollowUpDate !== undefined) {
            updateData.nextFollowUpDate = nextFollowUpDate ? new Date(nextFollowUpDate) : null;
        }
        if (nextFollowUpNote !== undefined) {
            updateData.nextFollowUpNote = nextFollowUpNote;
        }

        await prisma.lead.update({ where: { id }, data: updateData });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error('[CRM Send Email] Error:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
