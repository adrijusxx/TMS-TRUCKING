import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { CampaignManager } from '@/lib/managers/CampaignManager';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/crm/campaigns/[id]/pause — Pause an active campaign
export async function POST(_req: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const campaign = await prisma.campaign.findFirst({
        where: { id, companyId: session.user.companyId },
    });

    if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status !== 'ACTIVE') {
        return NextResponse.json(
            { error: 'Only active campaigns can be paused' },
            { status: 400 }
        );
    }

    await CampaignManager.pauseCampaign(id);
    return NextResponse.json({ success: true, status: 'PAUSED' });
}
