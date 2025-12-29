/**
 * Fleet Diagnostics Sync API
 * 
 * POST - Sync diagnostic codes from Samsara
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getDiagnosticsService } from '@/lib/services/DiagnosticsService';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const service = getDiagnosticsService(session.user.companyId);
    const result = await service.syncFromSamsara();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Diagnostics sync error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

