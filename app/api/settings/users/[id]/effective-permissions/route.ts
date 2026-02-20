import { NextRequest } from 'next/server';
import { withPermission, handleApiError, successResponse } from '@/lib/api/route-helpers';
import { PermissionResolutionEngine } from '@/lib/managers/PermissionResolutionEngine';

/**
 * GET /api/settings/users/[id]/effective-permissions — Get computed effective permissions
 */
export const GET = withPermission('users.view', async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const permissions = await PermissionResolutionEngine.getEffectivePermissions(id);
    return successResponse({ userId: id, permissions });
  } catch (error) {
    return handleApiError(error);
  }
});
