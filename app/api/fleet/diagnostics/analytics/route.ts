/**
 * Fleet Diagnostics Analytics API
 * 
 * GET - Get aggregated diagnostics statistics and trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getDiagnosticsService } from '@/lib/services/DiagnosticsService';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    const dateFrom = searchParams.get('dateFrom') 
      ? new Date(searchParams.get('dateFrom')!) 
      : undefined;
    const dateTo = searchParams.get('dateTo') 
      ? new Date(searchParams.get('dateTo')!) 
      : undefined;

    const service = getDiagnosticsService(session.user.companyId);
    const analytics = await service.getAnalytics(dateFrom, dateTo);

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error('Diagnostics analytics error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

