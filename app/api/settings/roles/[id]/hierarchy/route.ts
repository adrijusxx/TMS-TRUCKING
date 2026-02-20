import { NextRequest } from 'next/server';
import { withPermission, handleApiError, successResponse, getRequestBody } from '@/lib/api/route-helpers';
import { RoleManager } from '@/lib/managers/RoleManager';
import { z } from 'zod';

const hierarchySchema = z.object({
  parentRoleId: z.string().nullable(),
});

/**
 * PUT /api/settings/roles/[id]/hierarchy — Change parent role
 */
export const PUT = withPermission('users.edit', async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await getRequestBody(request);
    const data = hierarchySchema.parse(body);

    await RoleManager.setParentRole(id, data.parentRoleId);

    return successResponse({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
});
