import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleApiError, successResponse, getRequestBody } from '@/lib/api/route-helpers';
import { PermissionGroupManager } from '@/lib/managers/PermissionGroupManager';
import { z } from 'zod';

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).optional(),
});

/**
 * GET /api/settings/permission-groups/[id] — Get group with details
 */
export const GET = withPermission('users.view', async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const group = await PermissionGroupManager.getGroupWithDetails(id);

    if (!group) {
      return NextResponse.json({ error: 'Permission group not found' }, { status: 404 });
    }

    return successResponse(group);
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * PUT /api/settings/permission-groups/[id] — Update group
 */
export const PUT = withPermission('users.edit', async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await getRequestBody(request);
    const data = updateGroupSchema.parse(body);

    const group = await PermissionGroupManager.updateGroup(id, data);
    return successResponse(group);
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * DELETE /api/settings/permission-groups/[id] — Delete group
 */
export const DELETE = withPermission('users.delete', async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    await PermissionGroupManager.deleteGroup(id);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
});
