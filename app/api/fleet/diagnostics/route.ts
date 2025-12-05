/**
 * Fleet Diagnostics API
 * 
 * GET - List all diagnostic codes with filtering
 * PATCH - Mark a fault as resolved
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getDiagnosticsService } from '@/lib/services/DiagnosticsService';
import { z } from 'zod';

const patchSchema = z.object({
  action: z.enum(['resolve', 'reactivate']),
  faultId: z.string(),
  notes: z.string().optional(),
});

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
    
    const service = getDiagnosticsService(session.user.companyId);
    
    const result = await service.getDiagnostics({
      companyId: session.user.companyId,
      status: (searchParams.get('status') as 'active' | 'resolved' | 'all') || 'active',
      severity: searchParams.get('severity') || undefined,
      category: searchParams.get('category') || undefined,
      truckId: searchParams.get('truckId') || undefined,
      search: searchParams.get('search') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '50'),
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Diagnostics list error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId || !session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, faultId, notes } = patchSchema.parse(body);

    const service = getDiagnosticsService(session.user.companyId);

    let result;
    if (action === 'resolve') {
      result = await service.resolveFault(faultId, session.user.id, notes);
    } else {
      result = await service.reactivateFault(faultId);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Diagnostics update error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

