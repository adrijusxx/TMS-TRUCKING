import { NextRequest, NextResponse } from 'next/server';
import { LoadStatus } from '@prisma/client';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { autoUpdateLoadStatuses } from '@/lib/automation/load-status';

/**
 * Manually trigger automated load status updates
 * This can also be called by a cron job
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const result = await autoUpdateLoadStatuses(session.user.companyId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Automated load status update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

