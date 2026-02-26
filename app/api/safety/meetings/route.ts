import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createSafetyMeetingSchema } from '@/lib/validations/safety-meeting';
import { safetyMeetingManager } from '@/lib/managers/SafetyMeetingManager';

const MEETING_INCLUDES = {
  attendance: {
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
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { topic: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [meetings, totalCount] = await Promise.all([
      prisma.safetyMeeting.findMany({
        where,
        include: MEETING_INCLUDES,
        orderBy: { meetingDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.safetyMeeting.count({ where }),
    ]);

    return NextResponse.json({
      data: meetings,
      meta: { totalCount, totalPages: Math.ceil(totalCount / limit), page, pageSize: limit },
    });
  } catch (error) {
    console.error('Error fetching safety meetings:', error);
    return NextResponse.json({ error: 'Failed to fetch safety meetings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSafetyMeetingSchema.parse(body);
    const meeting = await safetyMeetingManager.createMeeting(session.user.companyId, parsed);

    return NextResponse.json({ data: meeting }, { status: 201 });
  } catch (error) {
    console.error('Error creating safety meeting:', error);
    return NextResponse.json({ error: 'Failed to create safety meeting' }, { status: 500 });
  }
}
