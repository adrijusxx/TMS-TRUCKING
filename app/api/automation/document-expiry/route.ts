import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { checkAllDocumentExpiries } from '@/lib/automation/document-expiry';

/**
 * Manually trigger document expiry check
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

    const body = await request.json().catch(() => ({}));
    const daysAhead = body.daysAhead || 30;

    const result = await checkAllDocumentExpiries(session.user.companyId, daysAhead);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Document expiry check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

