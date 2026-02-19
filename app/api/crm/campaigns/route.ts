import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { CampaignManager } from '@/lib/managers/CampaignManager';

// GET /api/crm/campaigns — List campaigns
export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaigns = await prisma.campaign.findMany({
        where: { companyId: session.user.companyId },
        orderBy: { updatedAt: 'desc' },
        include: {
            createdBy: { select: { firstName: true, lastName: true } },
            steps: { orderBy: { sortOrder: 'asc' }, select: { id: true, sortOrder: true, delayDays: true, delayHours: true } },
            _count: { select: { recipients: true } },
        },
    });

    return NextResponse.json(campaigns);
}

// POST /api/crm/campaigns — Create a new campaign
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, description, channel, audienceFilter, isDrip, steps } = body;

        if (!name?.trim() || !channel) {
            return NextResponse.json(
                { error: 'Name and channel are required' },
                { status: 400 }
            );
        }

        if (!steps || !Array.isArray(steps) || steps.length === 0) {
            return NextResponse.json(
                { error: 'At least one step is required' },
                { status: 400 }
            );
        }

        // Validate each step has content
        for (const step of steps) {
            if (!step.templateId && !step.body?.trim()) {
                return NextResponse.json(
                    { error: 'Each step must have a template or inline message body' },
                    { status: 400 }
                );
            }
        }

        const campaign = await CampaignManager.createCampaign({
            companyId: session.user.companyId,
            name: name.trim(),
            description: description?.trim(),
            channel,
            audienceFilter,
            isDrip: !!isDrip,
            createdById: session.user.id,
            steps,
        });

        return NextResponse.json(campaign, { status: 201 });
    } catch (error: any) {
        console.error('[Campaigns POST] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
