import { NextRequest } from 'next/server';
import { withPermission, handleApiError, successResponse, getRequestBody } from '@/lib/api/route-helpers';
import { PermissionGroupManager } from '@/lib/managers/PermissionGroupManager';
import { z } from 'zod';

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission required'),
});

/**
 * GET /api/settings/permission-groups — List all permission groups
 */
export const GET = withPermission('users.view', async (request, session) => {
  try {
    const groups = await PermissionGroupManager.getGroupsForCompany(session.user.companyId);
    return successResponse(groups);
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * POST /api/settings/permission-groups — Create a new group
 */
export const POST = withPermission('users.create', async (request, session) => {
  try {
    const body = await getRequestBody(request);
    const data = createGroupSchema.parse(body);

    const group = await PermissionGroupManager.createGroup({
      name: data.name,
      description: data.description,
      companyId: session.user.companyId,
      permissions: data.permissions,
    });

    return successResponse(group, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
