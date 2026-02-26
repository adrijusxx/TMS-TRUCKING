import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's notification preferences from their profile settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { notificationPreferences: true },
    });

    const defaults = {
      emailOnCritical: true,
      emailOnHigh: true,
      emailOnMedium: false,
      emailOnLow: false,
      dailyDigest: true,
      expirationWarningDays: 30,
    };

    const prefs = user?.notificationPreferences
      ? { ...defaults, ...(typeof user.notificationPreferences === 'object' ? user.notificationPreferences : {}) }
      : defaults;

    return NextResponse.json({ data: prefs });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        notificationPreferences: body,
      },
    });

    return NextResponse.json({ data: body });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
