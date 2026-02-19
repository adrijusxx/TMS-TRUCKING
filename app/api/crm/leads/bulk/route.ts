import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { sendSMS } from '@/lib/integrations/netsapiens/sms';
import { EmailService } from '@/lib/services/EmailService';
import { inngest } from '@/lib/inngest/client';

// POST /api/crm/leads/bulk - Bulk operations on leads
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { ids, action, payload } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No lead IDs provided' }, { status: 400 });
        }

        if (!action) {
            return NextResponse.json({ error: 'Action is required' }, { status: 400 });
        }

        // Ensure leads belong to user's MC scope
        const mcWhere = await buildMcNumberWhereClause(session, request);
        const accessibleLeads = await prisma.lead.findMany({
            where: { id: { in: ids }, ...mcWhere, deletedAt: null },
            select: { id: true },
        });
        const accessibleIds = accessibleLeads.map((l) => l.id);

        if (accessibleIds.length === 0) {
            return NextResponse.json({ error: 'No accessible leads found' }, { status: 404 });
        }

        let updated = 0;

        switch (action) {
            case 'status-change': {
                if (!payload?.status) {
                    return NextResponse.json({ error: 'Status is required' }, { status: 400 });
                }
                const result = await prisma.lead.updateMany({
                    where: { id: { in: accessibleIds } },
                    data: { status: payload.status },
                });
                updated = result.count;

                // Log activity for each lead
                await prisma.leadActivity.createMany({
                    data: accessibleIds.map((id) => ({
                        leadId: id,
                        type: 'STATUS_CHANGE' as const,
                        content: `Bulk status change to ${payload.status}`,
                        userId: session.user.id,
                        metadata: { newStatus: payload.status, bulk: true },
                    })),
                });

                // Fire-and-forget: automation rules (non-critical)
                Promise.all(
                    accessibleIds.map((id) =>
                        inngest.send({
                            name: 'automation/lead-event',
                            data: {
                                leadId: id,
                                companyId: session.user.companyId,
                                event: 'status_change',
                                metadata: { toStatus: payload.status },
                            },
                        })
                    )
                ).catch((err) => console.warn('[CRM Bulk] Inngest events failed:', err));
                break;
            }

            case 'assign': {
                if (!payload?.assignedToId) {
                    return NextResponse.json({ error: 'Assignee is required' }, { status: 400 });
                }
                const result = await prisma.lead.updateMany({
                    where: { id: { in: accessibleIds } },
                    data: { assignedToId: payload.assignedToId },
                });
                updated = result.count;

                await prisma.leadActivity.createMany({
                    data: accessibleIds.map((id) => ({
                        leadId: id,
                        type: 'ASSIGNMENT_CHANGE' as const,
                        content: 'Bulk assignment change',
                        userId: session.user.id,
                        metadata: { assignedToId: payload.assignedToId, bulk: true },
                    })),
                });
                break;
            }

            case 'delete': {
                const result = await prisma.lead.updateMany({
                    where: { id: { in: accessibleIds } },
                    data: { deletedAt: new Date() },
                });
                updated = result.count;
                break;
            }

            case 'send-sms': {
                if (!payload?.message?.trim()) {
                    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
                }
                const smsResult = await handleBulkSms(
                    accessibleIds, payload.message.trim(), session.user.id, session.user.companyId
                );
                return NextResponse.json({
                    success: true,
                    sent: smsResult.sent,
                    failed: smsResult.failed,
                    total: accessibleIds.length,
                });
            }

            case 'send-email': {
                if (!payload?.subject?.trim() || !payload?.body?.trim()) {
                    return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
                }
                const emailResult = await handleBulkEmail(
                    accessibleIds, payload.subject.trim(), payload.body.trim(), session.user.id
                );
                return NextResponse.json({
                    success: true,
                    sent: emailResult.sent,
                    failed: emailResult.failed,
                    total: accessibleIds.length,
                });
            }

            default:
                return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            updated,
            total: accessibleIds.length,
        });
    } catch (error) {
        console.error('[CRM Leads Bulk POST] Error:', error);
        return NextResponse.json(
            { error: 'Bulk operation failed' },
            { status: 500 }
        );
    }
}

async function handleBulkSms(
    leadIds: string[], message: string, userId: string, companyId: string
) {
    const leads = await prisma.lead.findMany({
        where: { id: { in: leadIds } },
        select: { id: true, phone: true },
    });

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { voipConfig: true },
    });
    const voipConfig = user?.voipConfig as Record<string, any> | null;
    const fromNumber = voipConfig?.pbxExtension || voipConfig?.username;

    let sent = 0;
    let failed = 0;

    for (const lead of leads) {
        if (!lead.phone || !fromNumber) { failed++; continue; }

        try {
            const result = await sendSMS(fromNumber, lead.phone, message, companyId);
            if (result.success) {
                sent++;
                await prisma.leadActivity.create({
                    data: {
                        leadId: lead.id, type: 'SMS', content: message,
                        userId, metadata: { sent: true, to: lead.phone, bulk: true },
                    },
                });
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: { lastContactedAt: new Date() },
                });
            } else { failed++; }
        } catch { failed++; }
    }

    return { sent, failed };
}

async function handleBulkEmail(
    leadIds: string[], subject: string, body: string, userId: string
) {
    const leads = await prisma.lead.findMany({
        where: { id: { in: leadIds } },
        select: { id: true, email: true },
    });

    let sent = 0;
    let failed = 0;

    for (const lead of leads) {
        if (!lead.email) { failed++; continue; }

        try {
            const ok = await EmailService.sendEmail({ to: lead.email, subject, html: body });
            if (ok) {
                sent++;
                await prisma.leadActivity.create({
                    data: {
                        leadId: lead.id, type: 'EMAIL',
                        content: `Subject: ${subject}\n\n${body}`,
                        userId, metadata: { sent: true, to: lead.email, bulk: true },
                    },
                });
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: { lastContactedAt: new Date() },
                });
            } else { failed++; }
        } catch { failed++; }
    }

    return { sent, failed };
}
