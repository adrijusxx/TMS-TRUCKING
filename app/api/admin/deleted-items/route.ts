/**
 * Admin API for fetching deleted items
 * GET /api/admin/deleted-items?type=truck|trailer|driver|load|invoice|customer|...
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { RestoreService } from '@/lib/services/RestoreService';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check admin role
    const isAdmin = session.user.role === 'ADMIN';
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const restoreService = new RestoreService();

    if (type === 'summary') {
      const summary = await restoreService.getDeletedItemsSummary(session.user.companyId);
      return NextResponse.json({ success: true, data: summary });
    }

    const data = await restoreService.getDeletedItems(session.user.companyId, type || 'truck');
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Deleted Items API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

