import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleApiError, successResponse, getRequestBody } from '@/lib/api/route-helpers';
import { RoleManager } from '@/lib/managers/RoleManager';
import { z } from 'zod';

const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  description: z.string().max(500).optional(),
  parentRoleId: z.string().optional(),
  permissions: z.array(z.string()).optional().default([]),
});

/**
 * GET /api/settings/roles — List all roles for the company
 */
export const GET = withPermission('users.view', async (request, session) => {
  try {
    const roles = await RoleManager.listRoles(session.user.companyId);
    return successResponse(roles);
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * POST /api/settings/roles — Create a new custom role
 */
export const POST = withPermission('users.create', async (request, session) => {
  try {
    const body = await getRequestBody(request);
    const data = createRoleSchema.parse(body);

    const role = await RoleManager.createRole({
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentRoleId: data.parentRoleId,
      companyId: session.user.companyId,
      permissions: data.permissions,
    });

    return successResponse(role, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
