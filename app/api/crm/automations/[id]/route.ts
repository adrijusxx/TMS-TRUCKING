import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/crm/automations/[id] — Update or toggle an automation rule
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.automationRule.findFirst({
        where: { id, companyId: session.user.companyId },
    });

    if (!existing) {
        return NextResponse.json({ error: 'Automation rule not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, enabled, triggerType, triggerValue, templateId, subject, body: ruleBody } = body;

    const rule = await prisma.automationRule.update({
        where: { id },
        data: {
            ...(name !== undefined && { name: name.trim() }),
            ...(enabled !== undefined && { enabled }),
            ...(triggerType !== undefined && { triggerType }),
            ...(triggerValue !== undefined && { triggerValue }),
            ...(templateId !== undefined && { templateId: templateId || null }),
            ...(subject !== undefined && { subject: subject?.trim() || null }),
            ...(ruleBody !== undefined && { body: ruleBody?.trim() || null }),
        },
    });

    return NextResponse.json(rule);
}

// DELETE /api/crm/automations/[id]
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.automationRule.findFirst({
        where: { id, companyId: session.user.companyId },
    });

    if (!existing) {
        return NextResponse.json({ error: 'Automation rule not found' }, { status: 404 });
    }

    await prisma.automationRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
