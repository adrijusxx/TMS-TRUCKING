import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createCampaignSchema } from '@/lib/validations/safety-recognition';

const CAMPAIGN_INCLUDES = {
  participants: {
    include: {
      driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
    },
  },
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    const [campaigns, totalCount] = await Promise.all([
      prisma.safetyCampaign.findMany({
        where,
        include: CAMPAIGN_INCLUDES,
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.safetyCampaign.count({ where }),
    ]);

    return NextResponse.json({
      data: campaigns,
      meta: { totalCount, totalPages: Math.ceil(totalCount / limit), page, pageSize: limit },
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createCampaignSchema.parse(body);

    const campaign = await prisma.safetyCampaign.create({
      data: {
        companyId: session.user.companyId,
        campaignName: parsed.campaignName,
        campaignType: parsed.campaignType,
        goal: parsed.goal ?? undefined,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
      },
      include: CAMPAIGN_INCLUDES,
    });

    return NextResponse.json({ data: campaign }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
