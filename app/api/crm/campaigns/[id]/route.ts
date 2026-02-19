import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { CampaignManager } from '@/lib/managers/CampaignManager';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/crm/campaigns/[id] — Campaign detail
export async function GET(_req: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const campaign = await prisma.campaign.findFirst({
        where: { id, companyId: session.user.companyId },
        include: {
            createdBy: { select: { firstName: true, lastName: true } },
            steps: {
                orderBy: { sortOrder: 'asc' },
                include: { template: { select: { name: true } } },
            },
            _count: { select: { recipients: true } },
        },
    });

    if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json(campaign);
}

// PATCH /api/crm/campaigns/[id] — Update campaign (draft only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.campaign.findFirst({
        where: { id, companyId: session.user.companyId },
    });

    if (!existing) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (existing.status !== 'DRAFT') {
        return NextResponse.json(
            { error: 'Only draft campaigns can be edited' },
            { status: 400 }
        );
    }

    const body = await request.json();
    const { name, description, audienceFilter, steps } = body;

    // Update campaign fields
    const campaign = await prisma.campaign.update({
        where: { id },
        data: {
            ...(name !== undefined && { name: name.trim() }),
            ...(description !== undefined && { description: description?.trim() || null }),
            ...(audienceFilter !== undefined && { audienceFilter }),
        },
    });

    // Replace steps if provided
    if (steps && Array.isArray(steps)) {
        await prisma.campaignStep.deleteMany({ where: { campaignId: id } });
        await prisma.campaignStep.createMany({
            data: steps.map((s: any, i: number) => ({
                campaignId: id,
                sortOrder: i,
                templateId: s.templateId || null,
                subject: s.subject || null,
                body: s.body || null,
                delayDays: s.delayDays ?? 0,
                delayHours: s.delayHours ?? 0,
            })),
        });
    }

    return NextResponse.json(campaign);
}

// DELETE /api/crm/campaigns/[id] — Archive campaign
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.campaign.findFirst({
        where: { id, companyId: session.user.companyId },
    });

    if (!existing) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    await CampaignManager.archiveCampaign(id);
    return NextResponse.json({ success: true });
}
