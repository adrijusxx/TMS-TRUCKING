import { NextRequest } from 'next/server';
import { withPermission, handleApiError, successResponse } from '@/lib/api/route-helpers';
import { PermissionResolutionEngine } from '@/lib/managers/PermissionResolutionEngine';

/**
 * GET /api/settings/users/[id]/permission-breakdown — Get annotated permission breakdown
 */
export const GET = withPermission('users.view', async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const breakdown = await PermissionResolutionEngine.getPermissionBreakdown(id);
    return successResponse(breakdown);
  } catch (error) {
    return handleApiError(error);
  }
});
