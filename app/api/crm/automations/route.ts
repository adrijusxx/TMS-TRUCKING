import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/crm/automations — List automation rules
export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rules = await prisma.automationRule.findMany({
        where: { companyId: session.user.companyId },
        orderBy: { createdAt: 'desc' },
        include: {
            template: { select: { name: true, channel: true } },
            createdBy: { select: { firstName: true, lastName: true } },
        },
    });

    return NextResponse.json(rules);
}

// POST /api/crm/automations — Create an automation rule
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, channel, triggerType, triggerValue, templateId, subject, body: ruleBody } = body;

    if (!name?.trim() || !channel || !triggerType) {
        return NextResponse.json(
            { error: 'Name, channel, and trigger type are required' },
            { status: 400 }
        );
    }

    if (!templateId && !ruleBody?.trim()) {
        return NextResponse.json(
            { error: 'A template or inline message body is required' },
            { status: 400 }
        );
    }

    const rule = await prisma.automationRule.create({
        data: {
            companyId: session.user.companyId,
            name: name.trim(),
            channel,
            triggerType,
            triggerValue: triggerValue || {},
            templateId: templateId || null,
            subject: subject?.trim() || null,
            body: ruleBody?.trim() || null,
            createdById: session.user.id,
        },
    });

    return NextResponse.json(rule, { status: 201 });
}
