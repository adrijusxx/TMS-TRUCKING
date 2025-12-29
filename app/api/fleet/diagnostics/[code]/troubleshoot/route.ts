/**
 * Fleet Diagnostics Troubleshooting API
 * 
 * GET - Get troubleshooting information for a specific fault code
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getDiagnosticsService } from '@/lib/services/DiagnosticsService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { code } = await params;
    
    if (!code) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Code parameter required' } },
        { status: 400 }
      );
    }

    const service = getDiagnosticsService(session.user.companyId);
    const troubleshooting = await service.getTroubleshooting(code);

    return NextResponse.json({
      success: true,
      data: troubleshooting,
    });
  } catch (error: any) {
    console.error('Troubleshooting lookup error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

