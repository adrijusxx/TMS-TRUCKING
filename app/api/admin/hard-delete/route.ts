/**
 * Admin API for hard deleting (permanently removing) soft-deleted items
 * POST /api/admin/hard-delete
 * WARNING: This permanently deletes data from the database!
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { RestoreService } from '@/lib/services/RestoreService';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId || !session.user.id) {
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

    const body = await request.json();
    const { entityType, entityId, entityIds, bulk } = body;

    const restoreService = new RestoreService();

    // Bulk hard delete
    if (bulk && entityIds && Array.isArray(entityIds) && entityIds.length > 0) {
      const results = await restoreService.bulkHardDeleteItems(entityType, entityIds, session.user.id);
      return NextResponse.json({
        success: true,
        data: {
          total: entityIds.length,
          deleted: results.deleted,
          failed: results.failed,
          errors: results.errors,
        },
      });
    }

    // Single hard delete
    if (!entityType || !entityId) {
      return NextResponse.json(
        { success: false, error: 'Missing entityType or entityId' },
        { status: 400 }
      );
    }

    const result = await restoreService.hardDeleteItem(entityType, entityId, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Hard Delete API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}



