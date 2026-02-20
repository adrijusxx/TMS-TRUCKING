import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleApiError, successResponse, getRequestBody } from '@/lib/api/route-helpers';
import { RoleManager } from '@/lib/managers/RoleManager';
import { z } from 'zod';

const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).optional(),
  parentRoleId: z.string().nullable().optional(),
});

/**
 * GET /api/settings/roles/[id] — Get role details with permissions
 */
export const GET = withPermission('users.view', async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const role = await RoleManager.getRoleWithDetails(id);

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return successResponse(role);
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * PUT /api/settings/roles/[id] — Update role
 */
export const PUT = withPermission('users.edit', async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await getRequestBody(request);
    const data = updateRoleSchema.parse(body);

    // Handle parent role change separately (validates hierarchy)
    if (data.parentRoleId !== undefined) {
      await RoleManager.setParentRole(id, data.parentRoleId);
    }

    const role = await RoleManager.updateRole(id, {
      name: data.name,
      description: data.description,
      permissions: data.permissions,
    });

    return successResponse(role);
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * DELETE /api/settings/roles/[id] — Delete custom role
 */
export const DELETE = withPermission('users.delete', async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    await RoleManager.deleteRole(id);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
});
