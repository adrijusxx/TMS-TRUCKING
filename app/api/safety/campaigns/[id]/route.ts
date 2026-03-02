import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateCampaignSchema } from '@/lib/validations/safety-recognition';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const campaign = await prisma.safetyCampaign.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
      include: {
        participants: {
          include: {
            driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
          },
          orderBy: { pointsEarned: 'desc' },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ data: campaign });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateCampaignSchema.parse(body);

    const campaign = await prisma.safetyCampaign.update({
      where: { id },
      data: {
        ...(parsed.campaignName && { campaignName: parsed.campaignName }),
        ...(parsed.campaignType && { campaignType: parsed.campaignType }),
        ...(parsed.goal !== undefined && { goal: parsed.goal }),
        ...(parsed.startDate && { startDate: parsed.startDate }),
        ...(parsed.endDate && { endDate: parsed.endDate }),
      },
    });

    return NextResponse.json({ data: campaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.safetyCampaign.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
