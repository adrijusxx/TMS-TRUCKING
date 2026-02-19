import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/crm/templates/[id]
export async function GET(_req: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const template = await prisma.messageTemplate.findFirst({
        where: { id, companyId: session.user.companyId },
    });

    if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
}

// PATCH /api/crm/templates/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, subject, body: templateBody } = body;

    const existing = await prisma.messageTemplate.findFirst({
        where: { id, companyId: session.user.companyId },
    });
    if (!existing) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const template = await prisma.messageTemplate.update({
        where: { id },
        data: {
            ...(name !== undefined && { name: name.trim() }),
            ...(subject !== undefined && { subject: subject?.trim() || null }),
            ...(templateBody !== undefined && { body: templateBody.trim() }),
        },
    });

    return NextResponse.json(template);
}

// DELETE /api/crm/templates/[id]
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.messageTemplate.findFirst({
        where: { id, companyId: session.user.companyId },
    });
    if (!existing) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await prisma.messageTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
