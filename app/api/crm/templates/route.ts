import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/crm/templates — List message templates
export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.messageTemplate.findMany({
        where: { companyId: session.user.companyId },
        orderBy: { updatedAt: 'desc' },
        include: { createdBy: { select: { firstName: true, lastName: true } } },
    });

    return NextResponse.json(templates);
}

// POST /api/crm/templates — Create a message template
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, channel, subject, body: templateBody } = body;

    if (!name?.trim() || !channel || !templateBody?.trim()) {
        return NextResponse.json(
            { error: 'Name, channel, and body are required' },
            { status: 400 }
        );
    }

    if (channel === 'EMAIL' && !subject?.trim()) {
        return NextResponse.json(
            { error: 'Subject is required for email templates' },
            { status: 400 }
        );
    }

    try {
        const template = await prisma.messageTemplate.create({
            data: {
                companyId: session.user.companyId,
                name: name.trim(),
                channel,
                subject: subject?.trim() || null,
                body: templateBody.trim(),
                createdById: session.user.id,
            },
        });

        return NextResponse.json(template, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'A template with this name already exists' },
                { status: 409 }
            );
        }
        throw error;
    }
}
