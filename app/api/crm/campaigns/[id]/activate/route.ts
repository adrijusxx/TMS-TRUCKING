import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { CampaignManager } from '@/lib/managers/CampaignManager';
import { inngest } from '@/lib/inngest/client';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/crm/campaigns/[id]/activate — Activate a campaign
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

    try {
        await CampaignManager.activateCampaign(id);

        // Trigger background execution via Inngest
        try {
            await inngest.send({
                name: 'campaign/execute',
                data: { campaignId: id, senderId: session.user.id },
            });
        } catch (inngestErr) {
            console.warn('[Campaign Activate] Inngest send failed:', inngestErr);
            return NextResponse.json({
                success: true,
                status: 'ACTIVE',
                warning: 'Campaign activated but background execution could not be triggered. Check Inngest configuration.',
            });
        }

        return NextResponse.json({ success: true, status: 'ACTIVE' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
