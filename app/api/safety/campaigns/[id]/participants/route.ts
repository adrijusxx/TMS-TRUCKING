import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addParticipantSchema } from '@/lib/validations/safety-recognition';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const participants = await prisma.campaignParticipant.findMany({
      where: { campaignId: id },
      include: {
        driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { pointsEarned: 'desc' },
    });

    return NextResponse.json({ data: participants });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = addParticipantSchema.parse(body);

    const participant = await prisma.campaignParticipant.upsert({
      where: {
        campaignId_driverId: { campaignId: id, driverId: parsed.driverId },
      },
      create: {
        campaignId: id,
        driverId: parsed.driverId,
        pointsEarned: parsed.pointsEarned ?? 0,
        achievement: parsed.achievement ?? undefined,
        bonusAmount: parsed.bonusAmount ?? undefined,
      },
      update: {
        pointsEarned: parsed.pointsEarned ?? undefined,
        achievement: parsed.achievement ?? undefined,
        bonusAmount: parsed.bonusAmount ?? undefined,
      },
      include: {
        driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    return NextResponse.json({ data: participant }, { status: 201 });
  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json({ error: 'Failed to add participant' }, { status: 500 });
  }
}
