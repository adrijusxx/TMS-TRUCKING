import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { CampaignManager } from '@/lib/managers/CampaignManager';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/crm/campaigns/[id]/preview — Preview audience from filter
// Also callable without an id: POST /api/crm/campaigns/preview (use campaignId = 'new')
export async function POST(request: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { audienceFilter, channel } = body;

    if (!channel) {
        return NextResponse.json({ error: 'Channel is required' }, { status: 400 });
    }

    const result = await CampaignManager.previewAudienceCount(
        audienceFilter,
        session.user.companyId,
        channel
    );

    return NextResponse.json(result);
}
