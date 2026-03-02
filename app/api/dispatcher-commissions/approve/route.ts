import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DispatcherPayManager } from '@/lib/managers/DispatcherPayManager';
import { handleApiError } from '@/lib/api/route-helpers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId || !session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ids array required' } },
        { status: 400 }
      );
    }

    const result = await DispatcherPayManager.approveCommissions(ids, session.user.id);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
