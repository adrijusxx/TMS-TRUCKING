import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { safetyMeetingManager } from '@/lib/managers/SafetyMeetingManager';
import { meetingAttendanceSchema } from '@/lib/validations/safety-meeting';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const attendance = await prisma.meetingAttendance.findMany({
      where: { meetingId: id },
      include: {
        driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    return NextResponse.json({ data: attendance });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
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
    const parsed = meetingAttendanceSchema.parse(body);
    const results = await safetyMeetingManager.recordAttendance(
      id,
      session.user.companyId,
      parsed.attendance
    );

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error('Error recording attendance:', error);
    return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
  }
}
